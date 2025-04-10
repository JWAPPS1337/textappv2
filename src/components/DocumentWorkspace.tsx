'use client';

import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import DocumentPreview from './DocumentPreview';
import StyleControls from './StyleControls';
import FileUploadZone from './FileUploadZone';
import PDFExporter from './PDFExporter';
import TemplateSelector from './TemplateSelector';
import useAiFormatter from '@/hooks/useAiFormatter';

export type DocumentStyle = {
  fontFamily: string;
  fontSize: string;
  textColor: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
};

export type TemplateType = 'standard' | 'report' | 'whitepaper';

export default function DocumentWorkspace() {
  const [content, setContent] = useState('');
  const [documentStyle, setDocumentStyle] = useState<DocumentStyle>({
    fontFamily: 'Arial',
    fontSize: '16px',
    textColor: '#000000',
    alignment: 'left',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('standard');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { formatWithAi, isFormatting, error: aiError } = useAiFormatter();

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleStyleChange = (newStyle: Partial<DocumentStyle>) => {
    setDocumentStyle((prevStyle) => ({
      ...prevStyle,
      ...newStyle,
    }));
  };

  const handleTemplateChange = (template: TemplateType) => {
    setSelectedTemplate(template);
  };

  const handleFileUpload = (files: File[]) => {
    // Limit to 10 files
    const newFiles = [...uploadedFiles, ...files].slice(0, 10);
    setUploadedFiles(newFiles);
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleAiFormat = async () => {
    if (!content) return;

    try {
      // Parse the Slate JSON content
      const parsedContent = JSON.parse(content);
      
      // Extract the text from the Slate nodes
      const plainText = extractTextFromSlateNodes(parsedContent);
      
      // Send to AI for formatting
      const formattedText = await formatWithAi(plainText, selectedTemplate);
      
      // For now, we'll update the content with the formatted text as a simple paragraph
      // A more sophisticated approach would parse the formatted text into Slate nodes
      const newContent = JSON.stringify([
        {
          type: 'paragraph',
          children: [{ text: formattedText }],
        },
      ]);
      
      setContent(newContent);
    } catch (error) {
      console.error('Error during AI formatting:', error);
    }
  };

  // Helper function to extract plain text from Slate nodes
  const extractTextFromSlateNodes = (nodes: any[]): string => {
    return nodes.map(node => {
      if (typeof node.text === 'string') {
        return node.text;
      } else if (Array.isArray(node.children)) {
        return extractTextFromSlateNodes(node.children);
      }
      return '';
    }).join(' ');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Document Template</div>
          </div>
          <div className="window-body">
            <TemplateSelector 
              selectedTemplate={selectedTemplate} 
              onTemplateChange={handleTemplateChange} 
            />
          </div>
        </div>
        
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Document Style</div>
          </div>
          <div className="window-body">
            <StyleControls 
              documentStyle={documentStyle} 
              onStyleChange={handleStyleChange} 
            />
          </div>
        </div>
        
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Text Editor</div>
          </div>
          <div className="window-body">
            <RichTextEditor 
              content={content} 
              onContentChange={handleContentChange} 
              documentStyle={documentStyle}
            />
          </div>
        </div>
        
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">AI Enhancement</div>
          </div>
          <div className="window-body" style={{ padding: '16px' }}>
            <button
              type="button"
              onClick={handleAiFormat}
              disabled={isFormatting || !content}
              className={isFormatting || !content ? 'disabled' : ''}
            >
              {isFormatting ? 'Processing...' : 'Format with AI'}
            </button>
            {aiError && (
              <div className="status-bar" style={{ marginTop: '10px', color: 'red' }}>
                <p className="status-bar-field">{aiError}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">PDF Files for Combination</div>
          </div>
          <div className="window-body">
            <FileUploadZone 
              uploadedFiles={uploadedFiles} 
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
            />
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Document Preview</div>
          </div>
          <div className="window-body">
            <DocumentPreview 
              content={content} 
              documentStyle={documentStyle} 
              template={selectedTemplate}
            />
          </div>
        </div>
        
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Export Document</div>
          </div>
          <div className="window-body">
            <PDFExporter 
              content={content} 
              documentStyle={documentStyle} 
              template={selectedTemplate}
              uploadedFiles={uploadedFiles}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 