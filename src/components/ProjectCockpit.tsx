

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, ProjectStatus } from '../types';
import { ClockIcon } from './icons/ClockIcon';

interface ProjectCockpitProps {
  project: Project;
  onProjectChange: (field: keyof Project, value: any) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-vscode-text-secondary mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);


export const ProjectCockpit: React.FC<ProjectCockpitProps> = ({ project, onProjectChange, isReadOnly }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(() => project.name);
  const [securityManager, setSecurityManager] = useState(() => project.securityManager || '');
  const [comment, setComment] = useState(() => project.comment || '');

  // Update local state if project prop changes from outside
  useEffect(() => {
    if (JSON.stringify({ project: project.name, manager: project.securityManager, comment: project.comment }) !== JSON.stringify({ project: name, manager: securityManager, comment })) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(project.name);
      setSecurityManager(project.securityManager || '');
      setComment(project.comment || '');
    }
  }, [project.name, project.securityManager, project.comment]);

  const handleBlur = (field: keyof Project, value: any) => {
    if (isReadOnly) return;
    onProjectChange(field, value);
  };

  return (
    <div className="p-8 text-vscode-text-primary space-y-8 max-w-4xl mx-auto w-full">
      {/* Project Details Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-vscode-border pb-2 text-vscode-text-primary">{t('projectDetails')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
          <div>
            <Label htmlFor="projectName">{t('projectName')}</Label>
            <Input
              id="projectName"
              type="text"
              value={name}
              onBlur={(e) => handleBlur('name', e.target.value)}
              onChange={(e) => setName(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label htmlFor="securityManager">{t('securityManager')}</Label>
            <Input
              id="securityManager"
              type="text"
              value={securityManager}
              placeholder={t('enterName')}
              onBlur={(e) => handleBlur('securityManager', e.target.value)}
              onChange={(e) => setSecurityManager(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label htmlFor="projectStatus">{t('projectStatus')}</Label>
            <Select
              id="projectStatus"
              value={project.projectStatus}
              onChange={(e) => onProjectChange('projectStatus', e.target.value as ProjectStatus)}
              disabled={isReadOnly}
            >
              {Object.values(ProjectStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
        </div>
      </section>

      {/* Comment Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-vscode-border pb-2 text-vscode-text-primary">{t('comment')}</h2>
        <Textarea
          value={comment}
          onBlur={(e) => handleBlur('comment', e.target.value)}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('addCommentsHere')}
          rows={8}
          disabled={isReadOnly}
        />
      </section>

      {/* History Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-vscode-border pb-2 text-vscode-text-primary flex items-center">
          <ClockIcon className="w-5 h-5 mr-3 text-vscode-text-secondary" />
          Project History
        </h2>
        <div className="bg-vscode-bg-sidebar rounded-lg p-4 h-80 overflow-y-auto border border-vscode-border">
          {project.history && project.history.length > 0 ? (
            <ul className="space-y-2">
              {project.history.slice().reverse().map((entry, index) => (
                <li key={index} className="text-sm text-vscode-text-secondary font-mono break-words leading-relaxed border-b border-vscode-border pb-1">
                  {entry}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-vscode-text-secondary">No history recorded yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
