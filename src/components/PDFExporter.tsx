'use client';

import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { PDFDocument } from 'pdf-lib';
import { DocumentStyle, TemplateType } from './DocumentWorkspace';

type PDFExporterProps = {
  content: string;
  documentStyle: DocumentStyle;
  template: TemplateType;
  uploadedFiles: File[];
};

export default function PDFExporter({ 
  content, 
  documentStyle, 
  template, 
  uploadedFiles 
}: PDFExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('Document');
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate a filename based on template type and date
  const generateFilename = () => {
    const date = new Date().toISOString().split('T')[0];
    const templateName = template.charAt(0).toUpperCase() + template.slice(1);
    return `${templateName}_Document_${date}.pdf`;
  };

  // Clone the preview content to the hidden div for PDF generation
  useEffect(() => {
    const updatePreviewContent = () => {
      const previewContent = document.querySelector('.preview-content');
      if (!previewContent) return;

      // Clear any existing content
      while (previewContent.firstChild) {
        previewContent.removeChild(previewContent.firstChild);
      }

      // Find the preview element in the document
      const documentPreview = document.querySelector('[data-preview-content]');
      if (documentPreview) {
        // Clone the preview content
        const clone = documentPreview.cloneNode(true) as HTMLElement;
        
        // Apply the document styles to ensure they're captured in the PDF
        if (clone) {
          clone.style.fontFamily = documentStyle.fontFamily;
          clone.style.fontSize = documentStyle.fontSize;
          clone.style.color = documentStyle.textColor;
          clone.style.textAlign = documentStyle.alignment;
          clone.style.padding = '20mm';
          clone.style.boxSizing = 'border-box';
          clone.style.minHeight = '297mm'; // A4 height
          clone.style.width = '210mm'; // A4 width
          clone.style.margin = '0';
          clone.style.backgroundColor = 'white';
          
          previewContent.appendChild(clone);
        }
      }
    };

    // Update the hidden div when content changes
    if (content) {
      updatePreviewContent();
    }
  }, [content, documentStyle, template]);

  // Export the document to PDF using html2pdf
  const handleExportPDF = async () => {
    if (!content) {
      setExportError('No content to export');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      setExportStatus('preparing');
      
      const opt = {
        margin: 0.5,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as 'portrait' }
      };
      
      if (previewRef.current) {
        await html2pdf().from(previewRef.current).set(opt).save();
      } else {
        throw new Error('Preview element not found');
      }
      
      setExportStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  // Merge the generated PDF with uploaded PDFs using pdf-lib
  const mergePDFs = async (generatedPDF: Blob) => {
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Add pages from the generated PDF
      const generatedPdfBytes = await generatedPDF.arrayBuffer();
      const genPdfDoc = await PDFDocument.load(generatedPdfBytes);
      const genPdfPages = await mergedPdf.copyPages(genPdfDoc, genPdfDoc.getPageIndices());
      genPdfPages.forEach(page => mergedPdf.addPage(page));
      
      // Add pages from each uploaded PDF
      for (const file of uploadedFiles) {
        try {
          const fileArrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(fileArrayBuffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          setExportError(`Error merging PDF: ${file.name}`);
        }
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      
      // Download the merged PDF
      downloadPDF(mergedPdfBlob, `Combined_${generateFilename()}`);
    } catch (error) {
      console.error('PDF merge error:', error);
      setExportError('Failed to merge PDFs. Please try again.');
      
      // Fall back to downloading just the generated PDF
      downloadPDF(generatedPDF, generateFilename());
    }
  };

  // Helper function to trigger a download
  const downloadPDF = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '8px' }}>
      <fieldset style={{ padding: '8px', margin: '4px 0' }}>
        <legend>Export to PDF</legend>
        
        <div className="field-row" style={{ marginBottom: '8px' }}>
          <label htmlFor="fileName">File Name:</label>
          <input
            id="fileName"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            style={{ flexGrow: 1 }}
          />
          <span>.pdf</span>
        </div>
        
        <div className="field-row" style={{ marginBottom: '8px' }}>
          <button
            onClick={handleExportPDF}
            disabled={exportStatus === 'preparing' || !content}
            style={{ marginRight: '8px' }}
          >
            {exportStatus === 'preparing' ? 'Generating...' : 'Export PDF'}
          </button>
          
          {exportStatus === 'success' && (
            <div className="status-bar" style={{ padding: '4px', color: 'green' }}>
              PDF exported successfully!
            </div>
          )}
          
          {exportStatus === 'error' && (
            <div className="status-bar" style={{ padding: '4px', color: 'red' }}>
              Error exporting PDF. Please try again.
            </div>
          )}
        </div>
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          Creates a PDF document based on your content and selected template.
        </div>
      </fieldset>
      
      {/* Hidden div for PDF generation */}
      <div ref={previewRef} className="preview-content" style={{ display: 'none' }} />
    </div>
  );
} 