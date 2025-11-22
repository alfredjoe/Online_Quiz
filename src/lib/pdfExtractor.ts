export interface Question {
  text: string;
  options: string[];
}

export interface ExtractResponse {
  text: string;
  questions: Question[];
}

export async function extractTextFromPDF(file: File): Promise<{ text: string; questions: any[] }> {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Sending PDF to server...');
  try {
    const rawBase = (import.meta as any).env?.VITE_PDF_EXTRACTOR_URL as string | undefined;
    const DEFAULT_BASE = 'http://localhost:5000';
    let base = (rawBase || DEFAULT_BASE).trim();

    if (!/^https?:\/\//i.test(base)) {
      if (/^(localhost|127\.)/.test(base)) {
        base = 'http://' + base;
      } else {
        base = 'https://' + base;
      }
    }

    const endpoint = base.replace(/\/+$/, '') + '/api/extract-text';

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch (e) {
        // ignore JSON parse errors
      }
      console.error('Server error:', errorData || `${response.status} ${response.statusText}`);
      throw new Error(errorData?.error || `Failed to extract text: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Server response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Failed to extract text from PDF');
    }

    return {
      text: data.text || '',
      questions: data.questions || []
    };
  } catch (error) {
    console.error('Error in extractTextFromPDF:', error);
    throw error;
  }
}
