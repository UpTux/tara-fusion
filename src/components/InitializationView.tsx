import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

interface InitializationViewProps {
    onLoadDemoData: () => void;
    onCreateFresh: (username: string, orgName: string) => void;
}

export const InitializationView: React.FC<InitializationViewProps> = ({ onLoadDemoData, onCreateFresh }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'selection' | 'custom'>('selection');
    const [username, setUsername] = useState('');
    const [orgName, setOrgName] = useState('');

    const handleCreate = () => {
        if (username.trim() && orgName.trim()) {
            onCreateFresh(username, orgName);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-vscode-bg-main text-vscode-text-primary">
            <div className="bg-vscode-bg-panel p-8 rounded-lg shadow-xl border border-vscode-border max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-center text-vscode-text-bright flex-1">
                        {t('welcomeToTaraFusion')}
                    </h1>
                    <div className="flex items-center space-x-2">
                        <ThemeSwitcher />
                        <LanguageSwitcher />
                    </div>
                </div>

                {step === 'selection' ? (
                    <div className="space-y-4">
                        <p className="text-vscode-text-secondary mb-6 text-center">
                            {t('initializationMessage')}
                        </p>

                        <button
                            onClick={onLoadDemoData}
                            className="w-full py-3 px-4 bg-transparent border border-vscode-button-bg text-vscode-button-bg rounded hover:bg-vscode-list-hover transition-colors flex items-center justify-center"
                        >
                            <span className="font-medium">{t('loadDemoData')}</span>
                        </button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-vscode-border"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-vscode-bg-panel text-sm text-vscode-text-secondary">
                                    {t('or')}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('custom')}
                            className="w-full py-3 px-4 bg-transparent border border-vscode-button-bg text-vscode-button-bg rounded hover:bg-vscode-list-hover transition-colors"
                        >
                            {t('createNewSetup')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-vscode-text-secondary mb-4 text-center">
                            {t('enterDetails')}
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                                {t('username')}
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 bg-vscode-input border border-vscode-border rounded text-vscode-text-primary focus:outline-none focus:border-vscode-accent-blue"
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-vscode-text-secondary mb-1">
                                {t('organizationName')}
                            </label>
                            <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="w-full px-3 py-2 bg-vscode-input border border-vscode-border rounded text-vscode-text-primary focus:outline-none focus:border-vscode-accent-blue"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setStep('selection')}
                                className="flex-1 py-2 px-4 bg-transparent border border-vscode-border text-vscode-text-secondary rounded hover:text-vscode-text-primary transition-colors"
                            >
                                {t('back')}
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!username.trim() || !orgName.trim()}
                                className={`flex-1 py-2 px-4 rounded text-white transition-colors ${username.trim() && orgName.trim()
                                    ? 'bg-vscode-button-bg hover:bg-vscode-button-hover'
                                    : 'bg-gray-600 cursor-not-allowed'
                                    } `}
                            >
                                {t('getStarted')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
