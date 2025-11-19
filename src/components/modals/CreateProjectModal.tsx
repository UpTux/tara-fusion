import React, { useState } from 'react';
import { TaraMethodology } from '../../types';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, methodology: TaraMethodology) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [projectName, setProjectName] = useState('');
    const [selectedMethodology, setSelectedMethodology] = useState<TaraMethodology>(TaraMethodology.ATTACK_FEASIBILITY);
    // const { t } = useTranslation();

    if (!isOpen) return null;

    const handleCreate = () => {
        if (projectName.trim()) {
            onCreate(projectName, selectedMethodology);
            setProjectName('');
            setSelectedMethodology(TaraMethodology.ATTACK_FEASIBILITY);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg shadow-xl w-full max-w-2xl flex flex-col animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-vscode-border flex items-center justify-between bg-vscode-bg-sidebar rounded-t-lg">
                    <h2 className="text-lg font-bold text-vscode-text-bright">Create New Project</h2>
                    <button onClick={onClose} className="text-vscode-text-secondary hover:text-vscode-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-vscode-text-secondary mb-2">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name..."
                            className="w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md text-vscode-text-primary focus:outline-none focus:ring-1 focus:ring-vscode-accent"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-vscode-text-secondary mb-3">
                            TARA Methodology
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Attack Feasibility Rating - Active */}
                            <div
                                className={`border rounded-md p-4 cursor-pointer transition-all ${selectedMethodology === TaraMethodology.ATTACK_FEASIBILITY
                                    ? 'border-vscode-accent bg-vscode-accent/10 ring-1 ring-vscode-accent'
                                    : 'border-vscode-border hover:border-vscode-text-secondary'
                                    }`}
                                onClick={() => setSelectedMethodology(TaraMethodology.ATTACK_FEASIBILITY)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-vscode-text-bright">Attack Feasibility</span>
                                    {selectedMethodology === TaraMethodology.ATTACK_FEASIBILITY && (
                                        <div className="w-3 h-3 rounded-full bg-vscode-accent"></div>
                                    )}
                                </div>
                                <p className="text-xs text-vscode-text-secondary">
                                    Standard ISO/SAE 21434 approach using Attack Feasibility Ratings (High, Medium, Low, Very Low).
                                </p>
                            </div>

                            {/* STRIDE - Disabled Placeholder */}
                            <div className="border border-vscode-border/50 rounded-md p-4 opacity-50 cursor-not-allowed bg-vscode-bg-input/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-vscode-text-secondary">STRIDE</span>
                                    <span className="text-[10px] uppercase border border-vscode-border px-1 rounded text-vscode-text-secondary">Coming Soon</span>
                                </div>
                                <p className="text-xs text-vscode-text-secondary">
                                    Microsoft's threat modeling methodology (Spoofing, Tampering, Repudiation, etc.).
                                </p>
                            </div>

                            {/* Likelihood - Disabled Placeholder */}
                            <div className="border border-vscode-border/50 rounded-md p-4 opacity-50 cursor-not-allowed bg-vscode-bg-input/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-vscode-text-secondary">Likelihood</span>
                                    <span className="text-[10px] uppercase border border-vscode-border px-1 rounded text-vscode-text-secondary">Coming Soon</span>
                                </div>
                                <p className="text-xs text-vscode-text-secondary">
                                    Risk assessment based on Likelihood and Impact matrices.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 p-4 border-t border-vscode-border bg-vscode-bg-sidebar rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!projectName.trim()}
                        className={`px-4 py-2 rounded-md text-white transition-colors text-sm font-medium ${projectName.trim()
                            ? 'bg-vscode-accent hover:bg-vscode-accent/90'
                            : 'bg-vscode-accent/50 cursor-not-allowed'
                            }`}
                    >
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
};
