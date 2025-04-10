import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Check if file extension is supported
    if (!['doc', 'docx', 'txt', 'rtf', 'html', 'jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: `File type .${fileExtension} is not supported` },
        { status: 400 }
      );
    }

    // Create a temporary directory for file processing
    const tempDir = join(tmpdir(), 'document-converter');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Generate unique filenames
    const fileId = uuidv4();
    const inputPath = join(tempDir, `${fileId}.${fileExtension}`);
    const outputPath = join(tempDir, `${fileId}.pdf`);
    
    // Write the uploaded file to the temp directory
    const bytes = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(bytes));

    // Process the file based on its type
    if (['jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
      // For images, convert to PDF
      await convertImageToPdf(inputPath, outputPath);
    } else if (['txt', 'html', 'rtf'].includes(fileExtension || '')) {
      // For text files, create a simple PDF with the text content
      await convertTextToPdf(inputPath, outputPath);
    } else {
      // For DOCX files, we'll create a placeholder with a message
      // In a production environment, this would use a server-side library
      await createPlaceholderPdf(outputPath, file.name);
    }

    return NextResponse.json({
      success: true,
      message: 'File converted successfully',
      fileId: fileId
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}

// Convert an image to PDF using pdf-lib
async function convertImageToPdf(imagePath: string, outputPath: string) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a blank page
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Read the image file
    const imageBytes = await readFile(imagePath);
    
    // Embed the image in the PDF
    let image;
    if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (imagePath.endsWith('.png')) {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error('Unsupported image format');
    }
    
    // Calculate dimensions to fit the image on the page
    const { width, height } = page.getSize();
    const imgDims = image.scale(1);
    
    // Scale the image to fit the page (with margins)
    const margin = 50;
    const scaleFactor = Math.min(
      (width - margin * 2) / imgDims.width,
      (height - margin * 2) / imgDims.height
    );
    
    const scaledWidth = imgDims.width * scaleFactor;
    const scaledHeight = imgDims.height * scaleFactor;
    
    // Center the image on the page
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;
    
    // Draw the image
    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    await writeFile(outputPath, pdfBytes);
  } catch (error) {
    console.error('Error converting image to PDF:', error);
    throw error;
  }
}

// Convert a text file to PDF
async function convertTextToPdf(textPath: string, outputPath: string) {
  try {
    // Read the text file
    const textContent = await readFile(textPath, 'utf8');
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page to the document
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Embed fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // Set up text parameters
    const fontSize = 12;
    const smallFontSize = 10;
    const titleFontSize = 18;
    const lineHeight = fontSize * 1.5;
    const margin = 50;
    const { width, height } = page.getSize();
    const maxWidth = width - margin * 2;
    
    // Split text into paragraphs first
    const paragraphs = textContent.split(/\n\s*\n/);
    
    // Current position for drawing text
    let y = height - margin - titleFontSize;
    let currentPage = page;
    
    // Add a title based on the filename
    const filename = textPath.split(/[\\/]/).pop() || 'Document';
    const title = filename.replace(/\.\w+$/, '');
    
    currentPage.drawText(title, {
      x: margin,
      y,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    y -= titleFontSize * 1.5;
    
    // Process each paragraph
    for (const paragraph of paragraphs) {
      // Skip empty paragraphs
      if (!paragraph.trim()) continue;
      
      // Check if this is a heading (simplified detection)
      const isHeading = paragraph.trim().length < 80 && 
                       (paragraph.endsWith(':') || 
                        !paragraph.includes('.') || 
                        paragraph.toUpperCase() === paragraph);
      
      // Determine font and size based on content
      const font = isHeading ? boldFont : regularFont;
      const size = isHeading ? fontSize * 1.2 : fontSize;
      
      // Split paragraph into lines that fit within the page width
      const lines: string[] = [];
      const words = paragraph.split(/\s+/);
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, size);
        
        if (textWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Check if we need a new page
      if (y - (lines.length * lineHeight) < margin) {
        currentPage = pdfDoc.addPage([612, 792]);
        y = height - margin - fontSize;
      }
      
      // Draw the lines
      for (const line of lines) {
        currentPage.drawText(line, {
          x: margin,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        
        y -= lineHeight;
        
        // If we run out of space, add a new page
        if (y < margin) {
          currentPage = pdfDoc.addPage([612, 792]);
          y = height - margin - fontSize;
        }
      }
      
      // Add space after each paragraph
      y -= fontSize;
    }
    
    // Add page numbers
    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { height } = page.getSize();
      
      // Draw page numbers at the bottom
      page.drawText(`Page ${i + 1} of ${pageCount}`, {
        x: margin,
        y: margin / 2,
        size: smallFontSize,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    await writeFile(outputPath, pdfBytes);
  } catch (error) {
    console.error('Error converting text to PDF:', error);
    throw error;
  }
}

// Create a placeholder PDF for document types that need server-side conversion
async function createPlaceholderPdf(outputPath: string, fileName: string) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page to the document
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Embed fonts
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // Get page dimensions
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Add a header with a light gray background
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: rgb(0.95, 0.95, 0.95),
    });
    
    // Draw a title
    page.drawText('Document Conversion', {
      x: margin,
      y: height - 70,
      size: 28,
      font: titleFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    
    // Draw a horizontal line
    page.drawLine({
      start: { x: margin, y: height - 90 },
      end: { x: width - margin, y: height - 90 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    // Draw the file name with icon-like prefix
    page.drawText('📄', {
      x: margin,
      y: height - 150,
      size: 16,
      font: regularFont,
    });
    
    page.drawText(`Original file: ${fileName}`, {
      x: margin + 25,
      y: height - 150,
      size: 14,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Add information box with light blue background
    page.drawRectangle({
      x: margin,
      y: height - 350,
      width: width - (margin * 2),
      height: 180,
      color: rgb(0.9, 0.95, 1),
      borderColor: rgb(0.7, 0.8, 0.9),
      borderWidth: 1,
      opacity: 0.8,
    });
    
    // Draw information title
    page.drawText('Conversion Information', {
      x: margin + 10,
      y: height - 180,
      size: 16,
      font: titleFont,
      color: rgb(0.2, 0.4, 0.6),
    });
    
    // Draw a message about server-side conversion
    const messages = [
      'This file type requires server-side conversion with specialized libraries.',
      'In a production environment, this would use a complete server-side',
      'implementation with libraries like OpenPDF or a document conversion service.',
      '',
      'The converted document would preserve:',
      '• Document structure and formatting',
      '• Images and tables',
      '• Headers and footers',
      '• Text styles and fonts',
      '• Page layout and margins'
    ];
    
    let y = height - 210;
    for (const message of messages) {
      if (message === '') {
        y -= 15;
        continue;
      }
      
      const font = message.startsWith('•') ? italicFont : regularFont;
      const color = message.includes('OpenPDF') ? rgb(0.2, 0.4, 0.7) : rgb(0.2, 0.2, 0.2);
      
      page.drawText(message, {
        x: margin + 15,
        y,
        size: 12,
        font,
        color,
      });
      
      y -= 20;
    }
    
    // Add a footer
    page.drawLine({
      start: { x: margin, y: margin + 30 },
      end: { x: width - margin, y: margin + 30 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    // Add app name and date
    const currentDate = new Date().toLocaleDateString();
    page.drawText(`Text Format App • ${currentDate}`, {
      x: width / 2,
      y: margin + 15,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    await writeFile(outputPath, pdfBytes);
  } catch (error) {
    console.error('Error creating placeholder PDF:', error);
    throw error;
  }
} 