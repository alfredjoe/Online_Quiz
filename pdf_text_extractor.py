import base64
import requests
from pdf2image import convert_from_path
import os

# -------------------------------
# CONFIGURATION
# -------------------------------
APP_ID = "miniproject_9946de_04959c"
APP_KEY = "e4a3944a3821bca6f5617082bbc026ee1199f991bf789773b312348cb56fd302"

# -------------------------------
# UTILITY FUNCTIONS
# -------------------------------

def convert_pdf_to_images(pdf_path, output_folder):
    """Convert PDF pages to images."""
    os.makedirs(output_folder, exist_ok=True)
    images = convert_from_path(pdf_path, dpi=300)
    image_paths = []
    for i, image in enumerate(images):
        path = os.path.join(output_folder, f"page_{i+1}.png")
        image.save(path, "PNG")
        image_paths.append(path)
    return image_paths

def image_to_base64(image_path):
    """Convert image to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

def extract_text_from_image(image_path):
    """Extract text from image using Mathpix API."""
    base64_image = image_to_base64(image_path)

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

    response = requests.post("https://api.mathpix.com/v3/text", headers=headers, json=data)

    if response.status_code == 200:
        return response.json().get("text", "")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def extract_text_from_pdf(pdf_path):
    """Extract text from all pages of a PDF."""
    output_folder = "temp_pdf_pages"
    try:
        # Convert PDF to images
        image_paths = convert_pdf_to_images(pdf_path, output_folder)
        
        # Extract text from each page
        all_text = []
        for idx, image_path in enumerate(image_paths):
            print(f"Processing Page {idx + 1}...")
            text = extract_text_from_image(image_path)
            if text:
                all_text.append(f"--- Page {idx + 1} ---\n{text}\n")
        
        # Clean up temporary files
        for image_path in image_paths:
            os.remove(image_path)
        os.rmdir(output_folder)
        
        return "\n".join(all_text)
    
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return None

# Example usage
if __name__ == "__main__":
    pdf_path = "your_pdf_file.pdf"  # Replace with your PDF file path
    extracted_text = extract_text_from_pdf(pdf_path)
    if extracted_text:
        print("\nExtracted Text:")
        print(extracted_text) 