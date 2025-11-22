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
    // Railway backend URL - hardcoded
    const endpoint = 'https://onlinequizbackend-production.up.railway.app/api/extract-text';
    
    console.log('Using endpoint:', endpoint); // Debug log

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
        console.error('Failed to parse error response:', e);
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
