

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, RelatedDocument } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface RelatedDocumentsViewProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-vscode-text-secondary mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);

export const RelatedDocumentsView: React.FC<RelatedDocumentsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
    const { t } = useTranslation();
    const [documents, setDocuments] = useState<RelatedDocument[]>(project.relatedDocuments || []);
    const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id || null);
    const [editorState, setEditorState] = useState<RelatedDocument | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        const currentDocuments = project.relatedDocuments || [];
        setDocuments(currentDocuments);
        if (!selectedId && currentDocuments.length > 0) {
            setSelectedId(currentDocuments[0].id);
        }
    }, [project.relatedDocuments, selectedId]);

    useEffect(() => {
        const selected = documents.find(d => d.id === selectedId);
        setEditorState(selected ? { ...selected } : null);
    }, [selectedId, documents]);

    const addHistoryEntry = (proj: Project, message: string): Project => {
        const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
        return { ...proj, history: newHistory };
    };

    const handleAdd = () => {
        if (isReadOnly) return;
        const existingIds = new Set(documents.map(d => d.id));
        let i = 1;
        let newId = `DOC_${String(i).padStart(3, '0')}`;
        while (existingIds.has(newId)) { i++; newId = `DOC_${String(i).padStart(3, '0')}`; }

        const newDocument: RelatedDocument = {
            id: newId,
            authors: [],
            title: t('newDocument'),
            version: '1.0',
            url: '',
            comment: ''
        };

        const updatedDocuments = [...documents, newDocument];
        const updatedProject = addHistoryEntry({ ...project, relatedDocuments: updatedDocuments }, `Created Related Document ${newId}.`);
        onUpdateProject(updatedProject);
        setSelectedId(newId);
    };

    const handleUpdate = (field: keyof RelatedDocument, value: any) => {
        if (isReadOnly || !editorState) return;
        setEditorState(prev => prev ? { ...prev, [field]: value } : null);

        const originalDocument = documents.find(d => d.id === editorState.id);
        if (!originalDocument || JSON.stringify(originalDocument[field]) === JSON.stringify(value)) {
            return;
        }

        setSaveStatus('saving');
        const updatedDocuments = documents.map(d => d.id === editorState.id ? { ...editorState, [field]: value } : d);
        const updatedProject = addHistoryEntry({ ...project, relatedDocuments: updatedDocuments }, `Updated ${field} for Related Document ${editorState.id}.`);
        onUpdateProject(updatedProject);

        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1000);
        }, 100);
    };

    const handleDelete = (id: string) => {
        if (isReadOnly) return;
        const confirmDelete = window.confirm(t('confirmDeleteDocument', { id }));
        if (!confirmDelete) return;

        const updatedDocuments = documents.filter(d => d.id !== id);
        const updatedProject = addHistoryEntry({ ...project, relatedDocuments: updatedDocuments }, `Deleted Related Document ${id}.`);
        onUpdateProject(updatedProject);

        if (selectedId === id) {
            setSelectedId(updatedDocuments[0]?.id || null);
        }
    };

    const handleAuthorsChange = (authorsString: string) => {
        const authorsArray = authorsString.split(',').map(a => a.trim()).filter(a => a.length > 0);
        handleUpdate('authors', authorsArray);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-vscode-border flex justify-between items-center">
                <h2 className="text-2xl font-bold text-vscode-text-primary">{t('relatedDocuments')}</h2>
                <button
                    onClick={handleAdd}
                    title={t('addDocument')}
                    className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isReadOnly}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/3 border-r border-vscode-border overflow-y-auto">
                    {documents.length === 0 ? (
                        <div className="p-4 text-center text-vscode-text-secondary text-sm">
                            {t('noDocumentsYet')}
                        </div>
                    ) : (
                        <div>
                            {documents.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => setSelectedId(doc.id)}
                                    className={`p-3 cursor-pointer border-b border-vscode-border hover:bg-vscode-bg-hover ${selectedId === doc.id ? 'bg-vscode-bg-sidebar' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-vscode-text-primary truncate">{doc.title}</div>
                                            <div className="text-xs text-vscode-text-secondary mt-1">{doc.id}</div>
                                            <div className="text-xs text-vscode-text-secondary">v{doc.version}</div>
                                            {doc.authors.length > 0 && (
                                                <div className="text-xs text-vscode-text-secondary mt-1">
                                                    by {doc.authors.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editorState ? (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="max-w-3xl">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-vscode-text-primary">{editorState.title}</h3>
                                    <p className="text-sm text-vscode-text-secondary">{editorState.id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {saveStatus === 'saving' && <span className="text-xs text-vscode-text-secondary">{t('saving')}</span>}
                                    {saveStatus === 'saved' && <span className="text-xs text-green-500">{t('saved')}</span>}
                                    <button
                                        onClick={() => handleDelete(editorState.id)}
                                        title={t('deleteDocument')}
                                        className="p-1.5 text-vscode-text-secondary hover:text-red-500 hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isReadOnly}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="documentId">{t('documentId')}</Label>
                                    <Input id="documentId" value={editorState.id} disabled />
                                </div>

                                <div>
                                    <Label htmlFor="documentTitle">{t('documentTitle')}</Label>
                                    <Input
                                        id="documentTitle"
                                        value={editorState.title}
                                        onChange={e => handleUpdate('title', e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder={t('documentTitlePlaceholder')}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="documentVersion">{t('documentVersion')}</Label>
                                    <Input
                                        id="documentVersion"
                                        value={editorState.version}
                                        onChange={e => handleUpdate('version', e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder={t('documentVersionPlaceholder')}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="documentAuthors">{t('documentAuthors')}</Label>
                                    <Input
                                        id="documentAuthors"
                                        value={editorState.authors.join(', ')}
                                        onChange={e => handleAuthorsChange(e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder={t('documentAuthorsPlaceholder')}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="documentUrl">{t('documentUrl')}</Label>
                                    <Input
                                        id="documentUrl"
                                        type="url"
                                        value={editorState.url}
                                        onChange={e => handleUpdate('url', e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder={t('documentUrlPlaceholder')}
                                    />
                                    {editorState.url && (
                                        <a
                                            href={editorState.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-vscode-accent hover:underline mt-1 inline-block"
                                        >
                                            {t('openInNewTab')}
                                        </a>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="documentComment">{t('comment')}</Label>
                                    <Textarea
                                        id="documentComment"
                                        rows={6}
                                        value={editorState.comment || ''}
                                        onChange={e => handleUpdate('comment', e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder={t('documentCommentPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-vscode-text-secondary">
                        <div className="text-center">
                            <h3 className="text-lg">{t('noDocumentSelected')}</h3>
                            <p>{t('selectDocumentPrompt')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
