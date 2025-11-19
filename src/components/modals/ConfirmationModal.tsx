import React from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    isDangerous = false,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className={`p-4 border-b border-vscode-border flex items-center space-x-2 rounded-t-lg ${isDangerous ? 'bg-red-900/20' : 'bg-vscode-bg-sidebar'}`}>
                    {isDangerous && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    <h2 className={`text-lg font-bold ${isDangerous ? 'text-red-500' : 'text-vscode-text-bright'}`}>{title}</h2>
                </div>

                <div className="p-6">
                    <p className="text-vscode-text-primary">{message}</p>
                </div>

                <div className="flex justify-end space-x-3 p-4 border-t border-vscode-border bg-vscode-bg-sidebar rounded-b-lg">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-md text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors text-sm font-medium"
                    >
                        {cancelLabel || t('cancel') || 'Cancel'}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-md text-white transition-colors text-sm font-medium ${isDangerous
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-vscode-accent hover:bg-vscode-accent/90'
                            }`}
                    >
                        {confirmLabel || t('confirm') || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};
