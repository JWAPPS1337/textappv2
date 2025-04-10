'use client';

import { useCallback, useMemo, useState } from 'react';
import { createEditor, Descendant, BaseEditor, Operation, Editor, Transforms, Element as SlateElement, BaseSelection } from 'slate';
import { Slate, Editable, withReact, ReactEditor, useSlate } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { DocumentStyle } from './DocumentWorkspace';

type RichTextEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  documentStyle: DocumentStyle;
};

type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'bulleted-list' | 'numbered-list' | 'list-item';
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

type Format = 'bold' | 'italic' | 'underline';
type BlockFormat = 'paragraph' | 'heading-one' | 'heading-two' | 'bulleted-list' | 'numbered-list' | 'list-item';

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Custom button component for the toolbar
const ToolbarButton = ({ icon, isActive, onMouseDown }: { icon: string; isActive?: boolean; onMouseDown: (e: React.MouseEvent) => void }) => (
  <button
    type="button"
    className={isActive ? 'active' : ''}
    onMouseDown={onMouseDown}
    style={{ minWidth: '30px', margin: '0 2px' }}
  >
    {icon}
  </button>
);

// Button to toggle mark (bold, italic, underline)
const MarkButton = ({ format, icon }: { format: Format; icon: string }) => {
  const editor = useSlate();
  
  const isMarkActive = (editor: CustomEditor, format: Format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };
  
  const toggleMark = (editor: CustomEditor, format: Format) => {
    const isActive = isMarkActive(editor, format);
    
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };
  
  return (
    <ToolbarButton
      icon={icon}
      isActive={isMarkActive(editor, format)}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, format);
      }}
    />
  );
};

// Button to toggle block type (heading, list, etc.)
const BlockButton = ({ format, icon }: { format: BlockFormat; icon: string }) => {
  const editor = useSlate();
  
  const isBlockActive = (editor: CustomEditor, format: BlockFormat) => {
    const { selection } = editor;
    if (!selection) return false;
    
    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
      })
    );
    
    return !!match;
  };
  
  const toggleBlock = (editor: CustomEditor, format: BlockFormat) => {
    const isActive = isBlockActive(editor, format);
    const isList = format === 'bulleted-list' || format === 'numbered-list';
    
    Transforms.unwrapNodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && 
        (['bulleted-list', 'numbered-list'] as BlockFormat[]).includes(n.type as BlockFormat),
      split: true,
    });
    
    const newProperties: Partial<CustomElement> = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
    
    Transforms.setNodes<CustomElement>(editor, newProperties);
    
    if (!isActive && isList) {
      const block: CustomElement = { type: format, children: [] };
      Transforms.wrapNodes(editor, block);
    }
  };
  
  return (
    <ToolbarButton
      icon={icon}
      isActive={isBlockActive(editor, format)}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleBlock(editor, format);
      }}
    />
  );
};

// Toolbar component for rich text editing
const Toolbar = () => {
  return (
    <div className="status-bar" style={{ padding: '4px', marginBottom: '8px' }}>
      <MarkButton format="bold" icon="B" />
      <MarkButton format="italic" icon="I" />
      <MarkButton format="underline" icon="U" />
      <span style={{ margin: '0 5px', borderLeft: '1px solid #888', height: '18px', display: 'inline-block' }} />
      <BlockButton format="heading-one" icon="H1" />
      <BlockButton format="heading-two" icon="H2" />
      <span style={{ margin: '0 5px', borderLeft: '1px solid #888', height: '18px', display: 'inline-block' }} />
      <BlockButton format="bulleted-list" icon="•" />
      <BlockButton format="numbered-list" icon="#" />
    </div>
  );
};

// Initial value for the editor
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Enter your text here...' }],
  },
];

export default function RichTextEditor({ content, onContentChange, documentStyle }: RichTextEditorProps) {
  // Create a Slate editor that won't change across renders
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [editorValue, setEditorValue] = useState<Descendant[]>(() => {
    try {
      return content ? JSON.parse(content) : initialValue;
    } catch (error) {
      console.error('Error parsing editor content:', error);
      return initialValue;
    }
  });

  // Define a rendering function based on the element passed to it
  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case 'heading-one':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes}>{props.children}</h2>;
      case 'bulleted-list':
        return <ul {...props.attributes}>{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes}>{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  // Define a leaf rendering function
  const renderLeaf = useCallback((props: any) => {
    let { children, leaf, attributes } = props;
    
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }
    
    if (leaf.italic) {
      children = <em>{children}</em>;
    }
    
    if (leaf.underline) {
      children = <u>{children}</u>;
    }
    
    return <span {...attributes}>{children}</span>;
  }, []);

  // Convert Slate value to string for external storage
  const handleChange = (newValue: Descendant[]) => {
    setEditorValue(newValue);
    const isAstChange = editor.operations.some(
      (op: Operation) => 'set_selection' !== op.type
    );
    
    if (isAstChange) {
      const contentString = JSON.stringify(newValue);
      onContentChange(contentString);
    }
  };
  
  // Apply document styles
  const editorStyle = {
    fontFamily: documentStyle.fontFamily,
    fontSize: documentStyle.fontSize,
    color: documentStyle.textColor,
    textAlign: documentStyle.alignment,
    minHeight: '300px',
    padding: '8px',
  };

  return (
    <div style={{ padding: '8px' }}>
      <div className="sunken-panel" style={{ padding: '8px', marginBottom: '8px' }}>
        <Slate 
          editor={editor} 
          initialValue={editorValue}
          onChange={handleChange}
        >
          <Toolbar />
          <div className="sunken-panel" style={{ ...editorStyle, overflow: 'auto' }}>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Enter your text here..."
              spellCheck
              autoFocus
            />
          </div>
        </Slate>
      </div>
    </div>
  );
} 