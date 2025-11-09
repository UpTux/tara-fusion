
import React, { useState } from 'react';
import { suggestThreats } from '../../services/geminiService';
import { SphinxNeed } from '../../types';
import { SparklesIcon } from '../icons/SparklesIcon';

interface GeminiThreatModalProps {
  onClose: () => void;
  onGenerated: (needs: SphinxNeed[]) => void;
}

export const GeminiThreatModal: React.FC<GeminiThreatModalProps> = ({ onClose, onGenerated }) => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please provide a system description.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newNeeds = await suggestThreats(description);
      onGenerated(newNeeds);
      onClose();
    } catch (err) {
      setError('Failed to generate threats. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-vscode-bg-sidebar rounded-lg shadow-xl p-8 w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-6">
          <SparklesIcon className="w-8 h-8 text-purple-400 mr-4" />
          <h2 className="text-2xl font-bold text-white">Generate Threats with AI</h2>
        </div>
        <p className="text-vscode-text-secondary mb-4">
          Describe your system, application, or component. The more detail you provide, the better the threat suggestions will be.
          Consider including information about technologies used, data handled, and user roles.
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., A customer-facing web application for online banking, built with React and a Java backend, handling sensitive financial data..."
          className="w-full h-40 p-3 bg-vscode-bg-sidebar border border-vscode-border rounded-md text-vscode-text-primary focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          disabled={isLoading}
        />
        {error && <p className="text-red-400 mt-2">{error}</p>}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-md text-vscode-text-primary bg-vscode-bg-input hover:bg-vscode-bg-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
