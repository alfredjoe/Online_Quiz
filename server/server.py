from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import re
import base64
import requests
import fitz

app = Flask(__name__)
CORS(app)

# Optional: set these as environment variables for MathPix use
APP_ID = os.environ.get('MATHPIX_APP_ID', '')
APP_KEY = os.environ.get('MATHPIX_APP_KEY', '')

@app.route('/', methods=['GET'])
def home():
    return 'OK', 200


def convert_pdf_to_images(pdf_path, output_dir):
    images = []
    pdf_document = fitz.open(pdf_path)
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
        image_path = os.path.join(output_dir, f'page_{page_num + 1}.png')
        pix.save(image_path)
        images.append(image_path)
    pdf_document.close()
    return images


def image_to_base64(image_path):
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode()


def extract_text_from_image(image_path):
    # If MathPix credentials are provided, call MathPix; otherwise try simple extraction (not implemented)
    if not APP_ID or not APP_KEY:
        # No OCR provider configured
        return None

    headers = {
        'app_id': APP_ID,
        'app_key': APP_KEY,
        'Content-type': 'application/json'
    }

    data = {
        'src': f"data:image/png;base64,{image_to_base64(image_path)}",
        'formats': ['text'],
        'data_options': {
            'include_latex': True,
            'include_asciimath': True
        }
    }

    resp = requests.post('https://api.mathpix.com/v3/text', headers=headers, json=data, timeout=60)
    if resp.status_code == 200:
        return resp.json().get('text', '')
    return None


def parse_questions_and_options(text):
    questions = []
    question_blocks = re.split(r'(?=\d+\.)', text)
    for block in question_blocks:
        if not block.strip():
            continue
        m = re.match(r'(\d+)\.(.*?)(?=\([A-E]\)|$)', block, re.DOTALL)
        if not m:
            continue
        q_text = m.group(2).strip()
        option_matches = re.finditer(r'\(([A-E])\)\s*(.*?)(?=\s*\([A-E]\)|$)', block, re.DOTALL)
        options = [mo.group(2).strip() for mo in option_matches if mo.group(2).strip()]
        if q_text and options:
            questions.append({'text': q_text, 'options': options})
    return questions


@app.route('/api/extract-text', methods=['POST'])
def extract_text():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    f = request.files['file']
    if not f.filename or not f.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'File must be a PDF'}), 400

    try:
        with tempfile.TemporaryDirectory() as tmp:
            pdf_path = os.path.join(tmp, 'upload.pdf')
            f.save(pdf_path)
            images = convert_pdf_to_images(pdf_path, tmp)
            all_text = []
            for img in images:
                text = extract_text_from_image(img)
                if text:
                    all_text.append(text.strip())
            if not all_text:
                return jsonify({'error': 'No text extracted (MathPix creds missing or OCR failed)'}), 400
            final_text = '\n'.join(all_text)
            questions = parse_questions_and_options(final_text)
            formatted = []
            for q in questions:
                html = f"<p>{q['text']}</p>" + ''.join(f"<p>{opt}</p>" for opt in q['options'])
                formatted.append(html)
            return jsonify({'success': True, 'text': final_text, 'questions': formatted})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
