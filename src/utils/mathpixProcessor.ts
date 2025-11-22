
import { supabase } from "@/integrations/supabase/client";

/**
 * Processes a PDF file using Mathpix OCR to extract MCQ questions
 * @param file PDF file to be processed
 * @returns Extracted questions data or processing status
 */
export async function processPdfWithMathpix(file: File) {
  try {
    const timestamp = new Date().getTime();
    const filePath = `temp/${timestamp}_${file.name}`;
    
    // Upload file to temporary storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('temp-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('temp-uploads')
      .getPublicUrl(filePath);

    console.log("PDF uploaded to temporary URL:", publicUrl);
    
    // Send to Mathpix for processing
    const { data, error } = await supabase.functions.invoke('mathpix-ocr', {
      body: { 
        file_url: publicUrl,
        file_type: "pdf" 
      }
    });

    if (error) {
      throw new Error(error.message || "Failed to scan PDF");
    }
    
    console.log("MathPix PDF processing result:", data);

    // Clean up the temporary file
    await supabase.storage
      .from('temp-uploads')
      .remove([filePath]);

    return data;
  } catch (error: any) {
    console.error("Error in processPdfWithMathpix:", error);
    throw error;
  }
}

/**
 * Checks the status of a PDF processing job
 * @param pdfId The PDF processing job ID from Mathpix
 * @returns The current status and results if available
 */
export async function checkPdfProcessingStatus(pdfId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('mathpix-ocr', {
      body: { 
        pdf_id: pdfId,
        check_status: true
      }
    });
    
    if (error) {
      throw new Error(error.message || "Failed to check PDF status");
    }
    
    return data;
  } catch (error: any) {
    console.error("Error checking PDF processing status:", error);
    throw error;
  }
}

/**
 * Cleans MCQ text by removing content before first question and after "Space for rough work"
 * @param rawText The raw text extracted from PDF
 * @returns Cleaned text containing only the questions
 */
export function cleanMCQText(rawText: string): string {
  // Find where the first question starts (looking for patterns like "1." or "Question 1:")
  const questionStartRegex = /(?:^|\n)(?:question\s*)?1[\.\)]/i;
  const questionStart = rawText.search(questionStartRegex);
  
  // Find where "Space for rough work" or similar text appears
  const roughWorkRegex = /space\s+for\s+rough\s+work/i;
  const roughWorkStart = rawText.search(roughWorkRegex);
  
  // Extract just the questions section
  const start = questionStart !== -1 ? questionStart : 0;
  const end = roughWorkStart !== -1 ? roughWorkStart : rawText.length;
  
  return rawText.slice(start, end).trim();
}

/**
 * Parses cleaned text into structured MCQ objects
 * @param cleanedText Text containing only MCQ questions
 * @returns Array of structured MCQ objects
 */
export function parseMCQs(cleanedText: string) {
  // Split text into question blocks (each starting with a question number)
  const questionBlocks = cleanedText.split(/(?:\r?\n)+(?=(?:\d+[\.\)]|question\s*\d+:?))/i);
  
  return questionBlocks
    .map(block => {
      // Extract question number and text
      const questionMatch = block.match(/^(?:question\s*)?(\d+)[\.\):]\s*(.+?)(?:\r?\n|$)/i);
      if (!questionMatch) return null;
      
      const questionNumber = parseInt(questionMatch[1], 10);
      let questionText = questionMatch[2].trim();
      
      // Continue collecting question text until we hit options
      const lines = block.split(/\r?\n/);
      const firstLineIndex = lines.findIndex(line => 
        line.match(/^(?:question\s*)?(\d+)[\.\):]/i)
      );
      
      let currentIndex = firstLineIndex + 1;
      while (currentIndex < lines.length && 
             !lines[currentIndex].match(/^\s*\([A-E]\)/i) &&
             !lines[currentIndex].match(/^\s*[A-E]\)/i)) {
        questionText += " " + lines[currentIndex].trim();
        currentIndex++;
      }
      
      // Extract options
      const options = [];
      const optionRegex = /^\s*\(?([A-E])\)?\s*(.+)$/i;
      
      for (let i = currentIndex; i < lines.length; i++) {
        const optionMatch = lines[i].match(optionRegex);
        if (optionMatch) {
          options.push({
            label: optionMatch[1].toUpperCase(),
            text: optionMatch[2].trim()
          });
        }
      }
      
      return {
        number: questionNumber,
        text: questionText.replace(/\s+/g, ' ').trim(),
        options: options,
        correctOptionIndex: null
      };
    })
    .filter(Boolean);
}

/**
 * Process raw JSON data from Mathpix to extract structured MCQ questions
 * @param mathpixData The raw Mathpix response data
 * @returns Extracted and structured MCQ questions
 */
export function extractQuestionsFromMathpixData(mathpixData: any) {
  if (!mathpixData || !mathpixData.pages) {
    return [];
  }
  
  // Extract all text from the pages
  const allText = mathpixData.pages.map((page: any) => {
    if (!page.lines) return '';
    
    return page.lines
      .map((line: any) => line.text || '')
      .join('\n');
  }).join('\n');
  
  // Clean and parse the text
  const cleanedText = cleanMCQText(allText);
  return parseMCQs(cleanedText);
}
