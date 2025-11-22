from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pdf2image import convert_from_path
import base64
import requests
import tempfile
import re
import fitz

app = Flask(__name__)
# Configure CORS to allow all origins and methods
CORS(app, resources={r"/*": {
    "origins": ["https://online-quiz-gilt-eta.vercel.app/"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# Configuration
APP_ID = "miniproject_9946de_04959c"
APP_KEY = "e4a3944a3821bca6f5617082bbc026ee1199f991bf789773b312348cb56fd302"

# Verify API credentials
def verify_api_credentials():
    """Verify if MathPix API credentials are valid."""
    try:
        headers = {
            "app_id": APP_ID,
            "app_key": APP_KEY,
            "Content-type": "application/json"
        }
        
        # Make a test request to verify credentials
        response = requests.get("https://api.mathpix.com/v3/account", headers=headers)
        print(f"API Credentials verification status: {response.status_code}")
        
        if response.status_code == 200:
            print("API credentials are valid")
            return True
        else:
            print(f"API credentials verification failed: {response.text}")
            return False
    except Exception as e:
        print(f"Error verifying API credentials: {str(e)}")
        return False

# Verify credentials when server starts
verify_api_credentials()

def convert_pdf_to_images(pdf_path, output_dir):
    """Convert PDF pages to images."""
    try:
        print(f"Starting PDF conversion for: {pdf_path}")
        images = []
        
        # Open the PDF
        pdf_document = fitz.open(pdf_path)
        print(f"PDF opened successfully. Number of pages: {len(pdf_document)}")
        
        # Convert each page to an image
        for page_num in range(len(pdf_document)):
            print(f"Converting page {page_num + 1}")
            page = pdf_document[page_num]
            
            # Get the page's pixmap with higher resolution
            pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))  # 300 DPI
            
            # Save the image
            image_path = os.path.join(output_dir, f'page_{page_num + 1}.png')
            pix.save(image_path)
            images.append(image_path)
            print(f"Page {page_num + 1} saved as: {image_path}")
        
        pdf_document.close()
        print(f"PDF conversion completed. Created {len(images)} images")
        return images
        
    except Exception as e:
        print(f"Error in convert_pdf_to_images: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def image_to_base64(image_path):
    """Convert image to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

def extract_text_from_image(image_path):
    """Extract text from image using Mathpix API."""
    try:
        print(f"Processing image: {image_path}")
        base64_image = image_to_base64(image_path)
        print("Image converted to base64")

        headers = {
            "app_id": APP_ID,
            "app_key": APP_KEY,
            "Content-type": "application/json"
        }

        data = {
            "src": f"data:image/png;base64,{base64_image}",
            "formats": ["text"],
            "data_options": {
                "include_latex": True,
                "include_asciimath": True
            }
        }

        print("Sending request to MathPix API...")
        response = requests.post("https://api.mathpix.com/v3/text", headers=headers, json=data)
        print(f"MathPix API response status: {response.status_code}")

        if response.status_code == 200:
            response_data = response.json()
            print("MathPix API response:", response_data)
            
            text = response_data.get("text", "")
            if not text:
                print("Warning: No text extracted from MathPix response")
                return None
                
            print(f"Extracted text length: {len(text)}")
            print("Extracted text:", text)
            return text
        else:
            print(f"Error from MathPix API: {response.status_code}")
            print("Error response:", response.text)
            return None
    except Exception as e:
        print(f"Error in extract_text_from_image: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def parse_questions_and_options(text):
    """Parse text into questions and options, preserving LaTeX formatting."""
    questions = []
    # Split by question numbers (1., 2., etc.)
    question_blocks = re.split(r'(?=\d+\.)', text)
    
    for block in question_blocks:
        if not block.strip():
            continue
            
        # Extract question number and text
        question_match = re.match(r'(\d+)\.(.*?)(?=\([A-E]\)|$)', block, re.DOTALL)
        if not question_match:
            continue
            
        question_number = question_match.group(1)
        question_text = question_match.group(2).strip()
        
        # Extract options
        options = []
        option_matches = re.finditer(r'\(([A-E])\)(.*?)(?=\([A-E]\)|$)', block, re.DOTALL)
        for match in option_matches:
            option_text = match[2].strip()
            if option_text:
                # Format the option text to ensure proper LaTeX handling
                formatted_option = format_math_question(option_text)
                options.append(formatted_option)
        
        if question_text and options:
            # Format the question text to ensure proper LaTeX handling
            formatted_question = format_math_question(question_text)
            
            questions.append({
                'text': formatted_question,
                'options': options
            })
    
    return questions

def format_math_question(text: str) -> str:
    if not text:
        return text
    
    # Remove any double-wrapped LaTeX delimiters
    text = re.sub(r'\\\(\\\(', r'\(', text)
    text = re.sub(r'\\\)\\\)', r'\)', text)
    text = re.sub(r'\\\[\\\[', r'\[', text)
    text = re.sub(r'\\\]\\\]', r'\]', text)
    
    # If the text is already properly wrapped in LaTeX delimiters, return it as is
    if text.startswith('\\(') and text.endswith('\\)'):
        return text
    if text.startswith('\\[') and text.endswith('\\]'):
        return text
    if text.startswith('$') and text.endswith('$'):
        return text
    
    # Clean up any double spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Wrap the text in LaTeX delimiters if it's not already wrapped
    return f'\\({text}\\)'

@app.route('/api/extract-text', methods=['POST'])
def extract_text():
    if 'file' not in request.files:
        print("No file provided in request")
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        print("Empty filename in request")
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.pdf'):
        print(f"Invalid file type: {file.filename}")
        return jsonify({'error': 'File must be a PDF'}), 400

    try:
        print(f"Processing PDF file: {file.filename}")
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_path = os.path.join(temp_dir, 'upload.pdf')
            file.save(pdf_path)
            print(f"PDF saved to: {pdf_path}")
            
            print("Converting PDF to images...")
            image_paths = convert_pdf_to_images(pdf_path, temp_dir)
            print(f"Converted {len(image_paths)} pages to images")
            
            all_text = []
            for i, image_path in enumerate(image_paths):
                print(f"Processing page {i+1}...")
                text = extract_text_from_image(image_path)
                if text:
                    cleaned_text = text.strip()
                    if cleaned_text:
                        print(f"Page {i+1} text length: {len(cleaned_text)}")
                        all_text.append(cleaned_text)
                    else:
                        print(f"Page {i+1} returned empty text")
                else:
                    print(f"Failed to extract text from page {i+1}")
            
            if not all_text:
                print("No text could be extracted from any page")
                return jsonify({'error': 'No text could be extracted from the PDF'}), 400
                
            final_text = '\n'.join(all_text)
            print(f"Final extracted text length: {len(final_text)}")
            print("Final text preview:", final_text[:500] + "..." if len(final_text) > 500 else final_text)
            
            questions = parse_questions_and_options(final_text)
            print(f"Parsed {len(questions)} questions")
            
            formatted_questions = []
            for q in questions:
                formatted_question = f"<p>{q['text']}</p>"
                for option in q['options']:
                    formatted_question += f"<p>{option}</p>"
                formatted_questions.append(formatted_question)
            
            return jsonify({
                'success': True,
                'text': final_text,
                'questions': formatted_questions
            })
            
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to process PDF: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 