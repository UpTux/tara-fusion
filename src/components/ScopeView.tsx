

import React, { useRef, useState } from 'react';
import { Project } from '../types';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { ShareIcon } from './icons/ShareIcon';

interface ScopeViewProps {
  project: Project;
  onProjectChange: (field: keyof Project, value: any) => void;
  isReadOnly: boolean;
}

const plantUMLTemplate = `.. plantuml::
   :caption: Example PlantUML Diagram

   @startuml
   actor User
   participant "Web Application" as WebApp
   participant "API Server" as API
   database "Database" as DB

   User -> WebApp: Interact
   WebApp -> API: Request data
   API -> DB: Query data
   DB --> API: Return data
   API --> WebApp: Return data
   WebApp --> User: Display data
   @enduml
`;

const mermaidTemplate = `.. mermaid::
   :caption: Example Mermaid Diagram

   graph TD
       A[Start] --> B{Is it?};
       B -- Yes --> C[OK];
       C --> D[End];
       B -- No --> E[Find out];
       E --> B;
`;

export const ScopeView: React.FC<ScopeViewProps> = ({ project, onProjectChange, isReadOnly }) => {
  const [content, setContent] = useState(project.scope || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    if (isReadOnly || content === project.scope) return;

    setSaveStatus('saving');
    onProjectChange('scope', content);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const insertTemplate = (template: string) => {
    if (isReadOnly) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + template + text.substring(end);

    setContent(newText);
    textarea.focus();
    // Move cursor to the end of the inserted template
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + template.length;
    }, 0);
  };

  return (
    <div className="p-8 text-white flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 text-vscode-text-primary">Scope</h2>
      <p className="mb-6 text-vscode-text-secondary">
        Describe the scope of the project using reStructuredText (RST). Clearly define what is in scope and what is out of scope.
      </p>

      <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg flex flex-col flex-1">
        <div className="flex items-center justify-between p-2 border-b border-vscode-border">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => insertTemplate(plantUMLTemplate)}
              className="flex items-center px-3 py-1.5 bg-vscode-bg-input text-vscode-text-primary rounded-md text-xs font-medium hover:bg-vscode-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              <ShareIcon className="w-4 h-4 mr-2" />
              Insert PlantUML
            </button>
            <button
              onClick={() => insertTemplate(mermaidTemplate)}
              className="flex items-center px-3 py-1.5 bg-vscode-bg-input text-vscode-text-primary rounded-md text-xs font-medium hover:bg-vscode-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              <CodeBracketIcon className="w-4 h-4 mr-2" />
              Insert Mermaid
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus !== 'idle' || content === project.scope || isReadOnly}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50
                    ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50'}
                `}
          >
            {saveStatus === 'idle' && 'Save Changes'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved!'}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your reStructuredText content here..."
          className="w-full flex-1 p-4 bg-transparent text-vscode-text-primary focus:outline-none resize-none font-mono text-sm"
          readOnly={isReadOnly}
        />
      </div>
    </div>
  );
};
