'use client';

import { DocumentStyle, TemplateType } from './DocumentWorkspace';

type DocumentPreviewProps = {
  content: string;
  documentStyle: DocumentStyle;
  template: TemplateType;
};

export default function DocumentPreview({ content, documentStyle, template }: DocumentPreviewProps) {
  // If content is empty, show placeholder
  if (!content) {
    return (
      <div style={{ padding: '8px' }}>
        <div className="sunken-panel" style={{ padding: '16px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#888' }}>
            Enter content in the editor to see a preview
          </div>
        </div>
      </div>
    );
  }

  const previewStyle = {
    fontFamily: documentStyle.fontFamily,
    fontSize: documentStyle.fontSize,
    color: documentStyle.textColor,
    textAlign: documentStyle.alignment,
  };

  // Try to parse the content from JSON string
  let parsedContent;
  try {
    parsedContent = JSON.parse(content);
  } catch (error) {
    return (
      <div style={{ padding: '8px' }}>
        <div className="sunken-panel" style={{ padding: '16px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'red' }}>
            Error parsing document content
          </div>
        </div>
      </div>
    );
  }

  // Render content based on template type
  const renderTemplatedContent = () => {
    let templateClass = '';
    
    switch (template) {
      case 'report':
        templateClass = 'prose-headings:text-indigo-700 prose-p:text-justify prose-li:text-gray-800';
        break;
      case 'whitepaper':
        templateClass = 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-7 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic';
        break;
      default: // standard
        templateClass = 'prose-p:mb-4';
    }

    return (
      <div className={`prose max-w-none ${templateClass}`}>
        {renderSlateContent(parsedContent)}
      </div>
    );
  };

  // Recursive function to render Slate nodes
  const renderSlateContent = (nodes: any[]) => {
    return nodes.map((node, i) => {
      if (node.text !== undefined) {
        let textContent = node.text;

        if (node.bold) {
          textContent = <strong key={i}>{textContent}</strong>;
        }
        if (node.italic) {
          textContent = <em key={i}>{textContent}</em>;
        }
        if (node.underline) {
          textContent = <u key={i}>{textContent}</u>;
        }

        return textContent;
      }

      switch (node.type) {
        case 'paragraph':
          return <p key={i}>{renderSlateContent(node.children)}</p>;
        case 'heading-one':
          return <h1 key={i}>{renderSlateContent(node.children)}</h1>;
        case 'heading-two':
          return <h2 key={i}>{renderSlateContent(node.children)}</h2>;
        case 'bulleted-list':
          return <ul key={i}>{renderSlateContent(node.children)}</ul>;
        case 'numbered-list':
          return <ol key={i}>{renderSlateContent(node.children)}</ol>;
        case 'list-item':
          return <li key={i}>{renderSlateContent(node.children)}</li>;
        default:
          return <div key={i}>{renderSlateContent(node.children)}</div>;
      }
    });
  };

  return (
    <div style={{ padding: '8px' }}>
      <div
        data-preview-content
        className="sunken-panel"
        style={{ 
          ...previewStyle, 
          padding: '16px', 
          minHeight: '300px', 
          maxHeight: '500px',
          overflow: 'auto'
        }}
      >
        {renderTemplatedContent()}
      </div>
    </div>
  );
} 