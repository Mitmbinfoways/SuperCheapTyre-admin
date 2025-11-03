import React, { useState, useRef, useEffect } from 'react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaListUl,
  FaListOl,
  FaUndo,
  FaRedo,
  FaFont
} from 'react-icons/fa';
import { IconType } from 'react-icons';

interface ToolbarButton {
  icon: IconType;
  command: string;
  label: string;
}

interface TextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  value = '',
  onChange,
  className = '',
  placeholder = 'Start typing here...'
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('3');
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Initialize editor content only once
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      if (value) {
        editorRef.current.innerHTML = value;
      } else {
        editorRef.current.innerHTML = `<p>${placeholder}</p>`;
      }
      isInitialMount.current = false;
    }
  }, []);

  // Update editor when value prop changes externally
  useEffect(() => {
    if (!isInitialMount.current && editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      // Only update if the value is different from current content
      if (value !== currentContent && value !== undefined) {
        editorRef.current.innerHTML = value || `<p>${placeholder}</p>`;
      }
    }
  }, [value, placeholder]);

  const execCommand = (command: string, commandValue: string | null = null): void => {
    document.execCommand(command, false, commandValue || undefined);
    editorRef.current?.focus();
    
    // Trigger onChange after command execution
    setTimeout(() => {
      if (editorRef.current && onChange) {
        onChange(editorRef.current.innerHTML);
      }
    }, 0);
  };

  const handleInput = (): void => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const toolbarButtons: ToolbarButton[] = [
    { icon: FaBold, command: 'bold', label: 'Bold' },
    { icon: FaItalic, command: 'italic', label: 'Italic' },
    { icon: FaUnderline, command: 'underline', label: 'Underline' },
    { icon: FaAlignLeft, command: 'justifyLeft', label: 'Align Left' },
    { icon: FaAlignCenter, command: 'justifyCenter', label: 'Align Center' },
    { icon: FaAlignRight, command: 'justifyRight', label: 'Align Right' },
    { icon: FaListUl, command: 'insertUnorderedList', label: 'Bullet List' },
    { icon: FaListOl, command: 'insertOrderedList', label: 'Numbered List' },
    { icon: FaUndo, command: 'undo', label: 'Undo' },
    { icon: FaRedo, command: 'redo', label: 'Redo' }
  ];

  const fontSizes: string[] = ['1', '2', '3', '4', '5', '6', '7'];
  const fontSizeLabels: string[] = [
    'Tiny',
    'Small',
    'Normal',
    'Medium',
    'Large',
    'Huge',
    'Max'
  ];

  const handleFontSize = (size: string): void => {
    setSelectedSize(size);
    execCommand('fontSize', size);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    execCommand('foreColor', e.target.value);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Toolbar */}
        <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-2 flex flex-wrap gap-1 items-center">
          {/* Font Size */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
            <FaFont className="w-3 h-3 text-gray-700 dark:text-gray-300" />
            <select
              value={selectedSize}
              onChange={(e) => handleFontSize(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {fontSizes.map((size, index) => (
                <option key={size} value={size}>
                  {fontSizeLabels[index]}
                </option>
              ))}
            </select>
          </div>

          {/* Formatting Buttons */}
          {toolbarButtons.map((btn, idx) => {
            const Icon = btn.icon;
            return (
              <button
                key={idx}
                onClick={() => execCommand(btn.command)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                title={btn.label}
                type="button"
              >
                <Icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            );
          })}

          {/* Color Picker */}
          <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-700 pl-2 ml-1">
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Color:
            </label>
            <input
              type="color"
              onChange={handleColorChange}
              className="w-7 h-7 border border-gray-300 dark:border-gray-700 rounded cursor-pointer bg-transparent"
              title="Text Color"
            />
          </div>
        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[200px] p-4 focus:outline-none text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
          style={{ 
            wordBreak: 'break-word',
            lineHeight: '1.6'
          }}
          suppressContentEditableWarning
        />

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
          Character count: {editorRef.current?.innerText.length || 0}
        </div>
      </div>
    </div>
  );
};

export default TextEditor;