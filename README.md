# Stapler

A sophisticated document conversion and PDF processing application built with Next.js.

## Features

- Rich text editing with formatting capabilities (bold, italic, underline, lists)
- AI-powered text structuring and enhancement
- Support for multiple document templates (Standard, Reports, Whitepapers)
- Advanced PDF export and manipulation
- File upload with drag-and-drop support
- PDF combination
- Document to PDF conversion

## Tech Stack

- **Frontend Framework**: Next.js v14.1.0
- **UI Library**: React v18.2.0
- **Language**: TypeScript
- **Styling**: TailwindCSS (with @tailwindcss/typography plugin)
- **Rich Text Editing**: Slate.js
- **PDF Processing**: html2pdf.js, pdf-lib, mammoth.js
- **API Integration**: Axios

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

## Usage

1. **Document Conversion**: Convert various document formats (DOCX, TXT, images) to PDF
2. **Text Input**: Use the rich text editor to write or paste your content
3. **Formatting**: Apply formatting options like bold, italic, bullet points, etc.
4. **Document Style**: Customize font family, size, color, and alignment
5. **Template Selection**: Choose between Standard, Report, or Whitepaper templates
6. **File Upload**: Upload PDFs to combine with your document
7. **Preview**: See a real-time preview of your document
8. **Export**: Export your document as a PDF, optionally combining with uploaded PDFs

## API Integration

This app integrates with the Deepseek AI API for text enhancement and structuring. To use this feature:

1. Get an API key from [Deepseek](https://deepseek.ai)
2. Add the API key to your `.env.local` file

## License

MIT

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Slate.js](https://www.slatejs.org/)
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)
- [pdf-lib](https://pdf-lib.js.org/)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js)
- [Deepseek AI](https://deepseek.ai)
