import React from 'react';

interface ErrorModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, message, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-vscode-bg-sidebar border border-red-500 rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-vscode-border flex items-center space-x-2 bg-red-900/20 rounded-t-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-lg font-bold text-vscode-text-primary">Error</h2>
                </div>
                <div className="p-6">
                    <p className="text-vscode-text-primary">{message}</p>
                </div>
                <div className="flex justify-end space-x-4 p-4 border-t border-vscode-border bg-vscode-bg-sidebar rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
