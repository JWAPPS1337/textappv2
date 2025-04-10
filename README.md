# Stapler

A document conversion and PDF processing application with a focus on preserving formatting and professional output, built with Next.js.

## Core Features

- **Document to PDF Conversion:** 
  - Convert DOCX files to PDF with preserved formatting
  - Convert images (JPG/PNG) to PDF with optimized layout
  - Convert text files to PDF with intelligent formatting
  - Batch conversion capabilities

- **PDF Management:**
  - Combine multiple PDFs into a single document
  - Add images to existing PDFs
  - Convert photos to professional-looking documents
  
- **Professional Output:**
  - Automatically formatted documents with proper typography
  - Intelligent preservation of document structure
  - Customizable output with templates
  - Optimized for both screen viewing and printing

## Conversion Features

### DOCX Conversion
- Preserves headings, styles, and document structure
- Maintains lists and formatting elements
- Proper spacing and page layout
- Intelligent style mapping

### Image Conversion
- Auto-detects image orientation (portrait/landscape)
- Properly sizes images to fit the page
- Adds document title and metadata
- Applies subtle professional styling
- Optimizes image quality for PDF output

### Text File Conversion
- Intelligent paragraph detection and formatting
- Adds document title based on filename
- Includes page numbers on multi-page documents
- Proper line spacing and margins
- Automatic heading detection

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** TailwindCSS
- **PDF Processing:** html2pdf.js, pdf-lib, mammoth.js
- **Server API:** Next.js API routes

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JWAPPS1337/textappv2.git
   cd textappv2
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your API keys to `.env.local`
   ```
   DEEPSEEK_API_KEY=your_api_key_here
   PDF_CONVERSION_API_KEY=your_conversion_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Examples

### Converting a DOCX file to PDF
1. Select "Convert to PDF" tool
2. Upload your DOCX file
3. The application automatically preserves formatting
4. Download your professionally formatted PDF

### Converting an image to PDF
1. Select "Photo to PDF" tool
2. Upload your image file
3. The application automatically detects orientation and optimizes layout
4. Download your image as a properly formatted PDF

### Combining PDFs
1. Select "Combine PDFs" tool
2. Upload multiple PDF files
3. Arrange the order if needed
4. Download the combined PDF

## Future Enhancements

- OCR support for scanned documents
- Enhanced batch processing
- Digital signature support
- Advanced watermarking options
- Cloud storage integration

## License

MIT

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)
- [pdf-lib](https://pdf-lib.js.org/)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js)
