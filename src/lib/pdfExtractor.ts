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
        const response = await fetch('onlinequizbackend-production.up.railway.app', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.error || `Failed to extract text: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Server response:', data);

        if (!data.success) {
            throw new Error(data.error || 'Failed to extract text from PDF');
        }

        // Return the raw text without any parsing
        return {
            text: data.text || '',
            questions: data.questions || []
        };
    } catch (error) {
        console.error('Error in extractTextFromPDF:', error);
        throw error;
    }
} 