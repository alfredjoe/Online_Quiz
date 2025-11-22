import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MATHPIX_APP_ID = Deno.env.get("MATHPIX_APP_ID");
    const MATHPIX_APP_KEY = Deno.env.get("MATHPIX_APP_KEY");
    const MATHPIX_API_BASE = Deno.env.get("MATHPIX_API_BASE") || "https://api.mathpix.com";

    if (!MATHPIX_APP_ID || !MATHPIX_APP_KEY) {
      throw new Error("MathPix API credentials are not set");
    }

    // Parse request body
    const { imageBase64, file_url, file_type, pdf_id, check_status, raw_json } = await req.json();
    
    // Special case: if we're receiving raw JSON data directly
    if (raw_json) {
      console.log("Received raw JSON data from client");
      
      // Process the raw JSON to filter content between first question and "Space for rough work"
      if (raw_json.pages && Array.isArray(raw_json.pages)) {
        for (const page of raw_json.pages) {
          if (page.lines && Array.isArray(page.lines)) {
            // The filtering will be done client-side in the MathImageScanner component
            // We're keeping the full data here for flexibility
          }
        }
      }
      
      return new Response(JSON.stringify(raw_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Special case: if we're just checking a PDF status with an existing ID
    if (check_status && pdf_id) {
      console.log("Checking status for existing PDF ID:", pdf_id);
      const pollEndpoint = `${MATHPIX_API_BASE}/v3/pdf/${pdf_id}`;
      
      const pollResponse = await fetch(pollEndpoint, {
        method: "GET",
        headers: {
          app_id: MATHPIX_APP_ID,
          app_key: MATHPIX_APP_KEY,
          "Content-Type": "application/json",
        },
      });
      
      if (!pollResponse.ok) {
        const pollError = await pollResponse.text();
        console.error("PDF status check error:", pollError);
        throw new Error(`Error retrieving PDF results: ${pollResponse.status}`);
      }
      
      const pdfResults = await pollResponse.json();
      console.log("PDF status check results:", JSON.stringify(pdfResults, null, 2));
      
      // Handle the split status specifically
      if (pdfResults.status === "split") {
        console.log("PDF is in 'split' status, interpreting this as processing");
        return new Response(
          JSON.stringify({
            status: "processing",
            pdf_id: pdf_id,
            message: "PDF is still being processed. Please check again in a moment.",
            original_status: "split"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(JSON.stringify(pdfResults), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    let requestBody = {};
    let apiEndpoint = "";
    
    if (imageBase64) {
      // Remove data:image/png;base64, if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      requestBody = {
        src: base64Data,
        formats: ["text", "latex_styled"],
        data_options: {
          include_latex: true,
          include_asciimath: true,
        },
      };
      apiEndpoint = `${MATHPIX_API_BASE}/v3/text`;
      console.log("Processing image with MathPix text API");
    } else if (file_url && file_type === "pdf") {
      console.log("Processing PDF file:", file_url);
      
      // For PDF processing, we use the dedicated PDF endpoint
      requestBody = {
        url: file_url,
        conversion_formats: {
          pdf: true
        },
        conversion_targets: ["html", "text", "latex", "mathml"],
        include_detected_alphabets: true,
        page_ranges: "1-10",
        math_inline_delimiters: ["$", "$"],
        math_display_delimiters: ["$$", "$$"]
      };
      apiEndpoint = `${MATHPIX_API_BASE}/v3/pdf`;
      
      console.log("Calling MathPix PDF API with:", JSON.stringify(requestBody, null, 2));
    } else if (file_url) {
      // For regular image URLs
      requestBody = {
        url: file_url,
        formats: ["text", "latex_styled"],
        data_options: {
          include_latex: true,
          include_asciimath: true,
        },
      };
      apiEndpoint = `${MATHPIX_API_BASE}/v3/text`;
      console.log("Processing image URL with MathPix text API");
    } else {
      throw new Error("No image or file URL provided");
    }
    
    console.log("Calling MathPix API endpoint:", apiEndpoint);
    
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        app_id: MATHPIX_APP_ID,
        app_key: MATHPIX_APP_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("MathPix API Error Response:", errorData);
      throw new Error(`MathPix API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("MathPix API Response received successfully");
    
    if (file_type === "pdf" && apiEndpoint.includes("/pdf")) {
      console.log("PDF processing result:", JSON.stringify(data, null, 2));
      
      // If it's a PDF processing request, the response format will be different
      if (data.pdf_id) {
        console.log("PDF submitted for processing with ID:", data.pdf_id);
        
        // For PDFs, MathPix may return a processing ID that requires polling
        // Wait for initial processing (increased to 5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Poll for the results
        const pollEndpoint = `${MATHPIX_API_BASE}/v3/pdf/${data.pdf_id}`;
        console.log("Polling for PDF results at:", pollEndpoint);
        
        // Implement a retry mechanism for polling
        let maxRetries = 3;
        let pdfResults = null;
        
        for (let i = 0; i < maxRetries; i++) {
          console.log(`Polling attempt ${i + 1} of ${maxRetries}`);
          
          try {
            const pollResponse = await fetch(pollEndpoint, {
              method: "GET",
              headers: {
                app_id: MATHPIX_APP_ID,
                app_key: MATHPIX_APP_KEY,
                "Content-Type": "application/json",
              },
            });
            
            if (!pollResponse.ok) {
              const pollError = await pollResponse.text();
              console.error(`Poll attempt ${i + 1} error:`, pollError);
              
              if (i === maxRetries - 1) {
                throw new Error(`Error retrieving PDF results: ${pollResponse.status}`);
              }
              
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
              continue;
            }
            
            pdfResults = await pollResponse.json();
            console.log(`Poll attempt ${i + 1} result:`, JSON.stringify(pdfResults, null, 2));
            
            // Handle the "split" status
            if (pdfResults.status === "split") {
              console.log("PDF is in 'split' status, which means it's still being processed");
              
              // Return a processing status with PDF ID for client-side polling
              return new Response(
                JSON.stringify({
                  status: "processing",
                  pdf_id: data.pdf_id,
                  message: "PDF processing has started. Use the pdf_id to check status later.",
                  original_status: "split"
                }),
                {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }
            
            if (pdfResults.status === "completed") {
              console.log("PDF processing completed successfully");
              break;
            } else if (pdfResults.status === "processing") {
              console.log("PDF still processing, will retry");
              
              if (i === maxRetries - 1) {
                // Return the processing status with PDF ID for client-side polling
                return new Response(JSON.stringify({
                  status: "processing",
                  pdf_id: data.pdf_id,
                  message: "PDF is still being processed. Use the pdf_id to check status later."
                }), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
              // Status is failed or unknown
              console.error("PDF processing failed or returned unknown status:", pdfResults.status);
              break;
            }
          } catch (pollErr) {
            console.error(`Poll attempt ${i + 1} exception:`, pollErr);
            
            if (i === maxRetries - 1) {
              throw pollErr;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
          }
        }
        
        if (pdfResults) {
          console.log("Final PDF results:", JSON.stringify(pdfResults, null, 2));
          return new Response(JSON.stringify(pdfResults), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          // Return the processing status with PDF ID for client-side polling
          return new Response(JSON.stringify({
            status: "processing",
            pdf_id: data.pdf_id,
            message: "PDF is still being processed. Use the pdf_id to check status later."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }
    
    console.log("Returning MathPix API response");
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in mathpix-ocr function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unknown error occurred",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
