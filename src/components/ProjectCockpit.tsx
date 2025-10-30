

import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '../types';
import { ClockIcon } from './icons/ClockIcon';

interface ProjectCockpitProps {
  project: Project;
  onProjectChange: (field: keyof Project, value: any) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-400 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
     <select {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);


export const ProjectCockpit: React.FC<ProjectCockpitProps> = ({ project, onProjectChange, isReadOnly }) => {
  const [name, setName] = useState(project.name);
  const [securityManager, setSecurityManager] = useState(project.securityManager || '');
  const [comment, setComment] = useState(project.comment || '');

  // Update local state if project prop changes from outside
  useEffect(() => {
    setName(project.name);
    setSecurityManager(project.securityManager || '');
    setComment(project.comment || '');
  }, [project]);
  
  const handleBlur = (field: keyof Project, value: any) => {
    if (isReadOnly) return;
    onProjectChange(field, value);
  };

  return (
    <div className="p-8 text-white space-y-8 max-w-4xl mx-auto w-full">
      {/* Project Details Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-gray-300">Project Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
          <div>
            <Label htmlFor="projectName">Project Name</Label>
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
            <Label htmlFor="securityManager">Security Manager</Label>
            <Input 
              id="securityManager"
              type="text" 
              value={securityManager}
              placeholder="Enter name"
              onBlur={(e) => handleBlur('securityManager', e.target.value)}
              onChange={(e) => setSecurityManager(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <Label htmlFor="projectStatus">Project Status</Label>
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
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-gray-300">Comment</h2>
        <Textarea 
          value={comment}
          onBlur={(e) => handleBlur('comment', e.target.value)}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add comments here. Markdown is supported."
          rows={8}
          disabled={isReadOnly}
        />
      </section>

      {/* History Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-gray-300 flex items-center">
            <ClockIcon className="w-5 h-5 mr-3 text-gray-400" />
            Project History
        </h2>
        <div className="bg-gray-900/50 rounded-lg p-4 h-80 overflow-y-auto border border-gray-700/50">
          {project.history && project.history.length > 0 ? (
            <ul className="space-y-2">
              {project.history.slice().reverse().map((entry, index) => (
                <li key={index} className="text-sm text-gray-400 font-mono break-words leading-relaxed border-b border-gray-800 pb-1">
                    {entry}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No history recorded yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
