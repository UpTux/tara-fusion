import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    convertTechniqueToTechnicalTree,
    getAllPlatforms,
    getTechniquesByPlatform,
    getTechniquesByTactic,
    loadMitreAttackData,
    searchTechniques,
    type MitreAttackDatabase,
    type MitreTactic,
    type MitreTechnique,
} from '../services/mitreAttackService';
import { Project } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ErrorModal } from './modals/ErrorModal';

interface MitreAttackDatabaseViewProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    isReadOnly: boolean;
}

export const MitreAttackDatabaseView: React.FC<MitreAttackDatabaseViewProps> = ({
    project,
    onUpdateProject,
    isReadOnly,
}) => {
    const { t } = useTranslation();
    const [database, setDatabase] = useState<MitreAttackDatabase | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTactic, setSelectedTactic] = useState<string>('all');
    const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
    const [selectedMatrix, setSelectedMatrix] = useState<string>('all');
    const [expandedTechniques, setExpandedTechniques] = useState<Set<string>>(new Set());
    const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

    // Load MITRE ATT&CK data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await loadMitreAttackData();
                setDatabase(data);
                setError(null);
            } catch (err) {
                console.error('Failed to load MITRE ATT&CK data:', err);
                setError(t('mitreLoadError'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [t]);

    // Get all platforms for filter dropdown
    const platforms = useMemo(() => {
        if (!database) return [];
        return getAllPlatforms(database);
    }, [database]);

    // Get all tactics sorted (filtered by matrix)
    const tactics = useMemo(() => {
        if (!database) return [];
        return Array.from(database.tactics.values())
            .filter((tactic) => selectedMatrix === 'all' || (tactic as MitreTactic).matrix === selectedMatrix)
            .sort((a, b) => (a as MitreTactic).name.localeCompare((b as MitreTactic).name));
    }, [database, selectedMatrix]);

    // Filter techniques based on search, tactic, platform, and matrix
    const filteredTechniques = useMemo(() => {
        if (!database) return [];

        let techniques = Array.from(database.techniques.values());

        // Apply matrix filter
        if (selectedMatrix !== 'all') {
            techniques = techniques.filter(t => (t as MitreTechnique).matrix === selectedMatrix);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            techniques = searchTechniques(database, searchQuery).filter(
                t => selectedMatrix === 'all' || (t as MitreTechnique).matrix === selectedMatrix
            );
        }

        // Apply tactic filter
        if (selectedTactic !== 'all') {
            const selectedTacticObj = database.tactics.get(selectedTactic);
            if (selectedTacticObj) {
                techniques = getTechniquesByTactic(database, (selectedTacticObj as MitreTactic).name).filter(
                    t => selectedMatrix === 'all' || (t as MitreTechnique).matrix === selectedMatrix
                );
            }
        }

        // Apply platform filter
        if (selectedPlatform !== 'all') {
            techniques = getTechniquesByPlatform(database, selectedPlatform).filter(
                t => selectedMatrix === 'all' || (t as MitreTechnique).matrix === selectedMatrix
            );
        }

        return techniques.sort((a, b) => (a as MitreTechnique).id.localeCompare((b as MitreTechnique).id));
    }, [database, searchQuery, selectedTactic, selectedPlatform, selectedMatrix]);

    const toggleTechniqueExpansion = (techniqueId: string) => {
        setExpandedTechniques((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(techniqueId)) {
                newSet.delete(techniqueId);
            } else {
                newSet.add(techniqueId);
            }
            return newSet;
        });
    };

    const addHistoryEntry = (proj: Project, message: string): Project => {
        const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
        return { ...proj, history: newHistory };
    };

    const handleImportTechnique = (technique: MitreTechnique, includeSubtechniques: boolean = true) => {
        if (isReadOnly) return;

        const existingIds = new Set(project.needs.map((n) => n.id)) as Set<string>;
        const newNeeds = convertTechniqueToTechnicalTree(technique, existingIds, includeSubtechniques);

        if (newNeeds.length === 0) {
            setErrorModal({
                isOpen: true,
                message: t('mitreImportFailed')
            });
            return;
        }

        const updatedNeeds = [...project.needs, ...newNeeds];
        const message = includeSubtechniques
            ? `Imported MITRE technique ${technique.id} with ${technique.subtechniques.length} subtechniques as technical attack tree.`
            : `Imported MITRE technique ${technique.id} as technical attack tree.`;

        const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, message);
        onUpdateProject(updatedProject);

        setSuccessModal({
            isOpen: true,
            message: t('mitreImportSuccess', { techniqueId: technique.id, rootId: newNeeds[0].id })
        });
    };

    if (loading) {
        return (
            <div className="p-8 text-vscode-text-primary h-full flex items-center justify-center">
                <div className="text-center">
                    <DatabaseIcon className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                    <p className="text-lg">{t('mitreLoading')}</p>
                </div>
            </div>
        );
    }

    if (error || !database) {
        return (
            <div className="p-8 text-vscode-text-primary h-full flex items-center justify-center">
                <div className="text-center">
                    <DatabaseIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-lg text-red-500">{error || t('mitreLoadError')}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-vscode-accent text-white rounded-md hover:bg-vscode-accent/80"
                    >
                        {t('retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 text-vscode-text-primary h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <DatabaseIcon className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{t('mitreAttackDatabase')}</h2>
                </div>
                <p className="text-vscode-text-secondary">
                    {t('mitreAttackDatabaseDescription')}
                </p>
                <p className="text-sm text-vscode-text-secondary mt-1">
                    {t('mitreVersion')}: {database.version} | {t('lastUpdated')}: {database.lastUpdated}
                </p>
                <div className="mt-2 flex gap-4 text-sm text-vscode-text-secondary">
                    <span>Enterprise: {database.matrices.enterprise.techniques} techniques</span>
                    <span>Mobile: {database.matrices.mobile.techniques} techniques</span>
                    <span>ICS: {database.matrices.ics.techniques} techniques</span>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium mb-1">{t('search')}</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('mitreSearchPlaceholder')}
                        className="w-full px-3 py-2 bg-vscode-input-bg border border-vscode-input-border rounded-md text-vscode-text-primary focus:outline-none focus:border-vscode-accent"
                    />
                </div>

                {/* Matrix Filter */}
                <div>
                    <label className="block text-sm font-medium mb-1">{t('matrix')}</label>
                    <select
                        value={selectedMatrix}
                        onChange={(e) => setSelectedMatrix(e.target.value)}
                        className="w-full px-3 py-2 bg-vscode-input-bg border border-vscode-input-border rounded-md text-vscode-text-primary focus:outline-none focus:border-vscode-accent"
                    >
                        <option value="all">{t('allMatrices')}</option>
                        <option value="enterprise">{t('enterpriseMatrix')}</option>
                        <option value="mobile">{t('mobileMatrix')}</option>
                        <option value="ics">{t('icsMatrix')}</option>
                    </select>
                </div>

                {/* Tactic Filter */}
                <div>
                    <label className="block text-sm font-medium mb-1">{t('tactic')}</label>
                    <select
                        value={selectedTactic}
                        onChange={(e) => setSelectedTactic(e.target.value)}
                        className="w-full px-3 py-2 bg-vscode-input-bg border border-vscode-input-border rounded-md text-vscode-text-primary focus:outline-none focus:border-vscode-accent"
                    >
                        <option value="all">{t('allTactics')}</option>
                        {tactics.map((tactic) => (
                            <option key={tactic.id} value={tactic.id}>
                                {tactic.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Platform Filter */}
                <div>
                    <label className="block text-sm font-medium mb-1">{t('platform')}</label>
                    <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="w-full px-3 py-2 bg-vscode-input-bg border border-vscode-input-border rounded-md text-vscode-text-primary focus:outline-none focus:border-vscode-accent"
                    >
                        <option value="all">{t('allPlatforms')}</option>
                        {platforms.map((platform) => (
                            <option key={platform} value={platform}>
                                {platform}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-hidden flex gap-6">
                {/* Technique List */}
                <div className="w-1/2 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">
                            {t('techniques')} ({filteredTechniques.length})
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-vscode-border rounded-md">
                        {filteredTechniques.length === 0 ? (
                            <div className="p-8 text-center text-vscode-text-secondary">
                                <p>{t('noTechniquesFound')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-vscode-border">
                                {filteredTechniques.map((technique) => (
                                    <div key={technique.id} className="bg-vscode-bg">
                                        {/* Main Technique */}
                                        <div
                                            className={`p-4 hover:bg-vscode-hover cursor-pointer transition-colors ${selectedTechnique?.id === technique.id ? 'bg-vscode-selection' : ''
                                                }`}
                                            onClick={() => setSelectedTechnique(technique)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm font-semibold text-purple-400">
                                                            {technique.id}
                                                        </span>
                                                        <span
                                                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${technique.matrix === 'enterprise'
                                                                ? 'bg-blue-500/20 text-blue-300'
                                                                : technique.matrix === 'mobile'
                                                                    ? 'bg-green-500/20 text-green-300'
                                                                    : 'bg-orange-500/20 text-orange-300'
                                                                }`}
                                                        >
                                                            {technique.matrix === 'enterprise'
                                                                ? 'ENT'
                                                                : technique.matrix === 'mobile'
                                                                    ? 'MOB'
                                                                    : 'ICS'}
                                                        </span>
                                                        <span className="font-medium">{technique.name}</span>
                                                    </div>
                                                    <p className="text-sm text-vscode-text-secondary line-clamp-2">
                                                        {technique.description}
                                                    </p>
                                                    {technique.tactics.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {technique.tactics.map((tactic) => (
                                                                <span
                                                                    key={tactic}
                                                                    className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300"
                                                                >
                                                                    {tactic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {technique.subtechniques.length > 0 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleTechniqueExpansion(technique.id);
                                                            }}
                                                            className="p-1 hover:bg-vscode-button-hover rounded"
                                                        >
                                                            <ChevronDownIcon
                                                                className={`w-4 h-4 transition-transform ${expandedTechniques.has(technique.id) ? 'rotate-180' : ''
                                                                    }`}
                                                            />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImportTechnique(technique, true);
                                                        }}
                                                        disabled={isReadOnly}
                                                        className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                        title={t('importTechnique')}
                                                    >
                                                        <PlusIcon className="w-3 h-3" />
                                                        {t('import')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtechniques */}
                                        {expandedTechniques.has(technique.id) && technique.subtechniques.length > 0 && (
                                            <div className="bg-vscode-bg-dark border-t border-vscode-border">
                                                {technique.subtechniques.map((sub) => (
                                                    <div
                                                        key={sub.id}
                                                        className={`p-3 pl-8 hover:bg-vscode-hover cursor-pointer transition-colors border-l-2 border-purple-500/50 ${selectedTechnique?.id === sub.id ? 'bg-vscode-selection' : ''
                                                            }`}
                                                        onClick={() => setSelectedTechnique(sub)}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-mono text-xs font-semibold text-purple-300">
                                                                        {sub.id}
                                                                    </span>
                                                                    <span className="text-sm">{sub.name}</span>
                                                                </div>
                                                                <p className="text-xs text-vscode-text-secondary line-clamp-1">
                                                                    {sub.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Technique Details */}
                <div className="w-1/2 flex flex-col">
                    <h3 className="text-lg font-semibold mb-3">{t('details')}</h3>

                    {selectedTechnique ? (
                        <div className="flex-1 overflow-y-auto border border-vscode-border rounded-md p-6 bg-vscode-bg">
                            <div className="mb-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="font-mono text-xl font-bold text-purple-400">
                                            {selectedTechnique.id}
                                        </span>
                                        <h4 className="text-xl font-semibold mt-1">{selectedTechnique.name}</h4>
                                    </div>
                                    <button
                                        onClick={() => handleImportTechnique(selectedTechnique, true)}
                                        disabled={isReadOnly}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={t('importTechnique')}
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        {t('importToProject')}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-semibold mb-2">{t('description')}</h5>
                                    <p className="text-vscode-text-secondary">{selectedTechnique.description}</p>
                                </div>

                                {selectedTechnique.tactics.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold mb-2">{t('tactics')}</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTechnique.tactics.map((tactic) => (
                                                <span
                                                    key={tactic}
                                                    className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300"
                                                >
                                                    {tactic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTechnique.platforms.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold mb-2">{t('platforms')}</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTechnique.platforms.map((platform) => (
                                                <span
                                                    key={platform}
                                                    className="px-3 py-1 rounded-md bg-vscode-bg-dark border border-vscode-border"
                                                >
                                                    {platform}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTechnique.dataSourcesRequired.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold mb-2">{t('dataSourcesRequired')}</h5>
                                        <ul className="list-disc list-inside space-y-1 text-vscode-text-secondary">
                                            {selectedTechnique.dataSourcesRequired.map((ds) => (
                                                <li key={ds}>{ds}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedTechnique.detectionDescription && (
                                    <div>
                                        <h5 className="font-semibold mb-2">{t('detection')}</h5>
                                        <p className="text-vscode-text-secondary">
                                            {selectedTechnique.detectionDescription}
                                        </p>
                                    </div>
                                )}

                                {selectedTechnique.subtechniques.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold mb-2">
                                            {t('subtechniques')} ({selectedTechnique.subtechniques.length})
                                        </h5>
                                        <ul className="space-y-2">
                                            {selectedTechnique.subtechniques.map((sub) => (
                                                <li
                                                    key={sub.id}
                                                    className="p-3 rounded-md bg-vscode-bg-dark border border-vscode-border hover:border-purple-500/50 cursor-pointer"
                                                    onClick={() => setSelectedTechnique(sub)}
                                                >
                                                    <span className="font-mono text-sm font-semibold text-purple-300">
                                                        {sub.id}
                                                    </span>{' '}
                                                    - {sub.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <h5 className="font-semibold mb-2">{t('reference')}</h5>
                                    <a
                                        href={selectedTechnique.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-vscode-accent hover:underline"
                                    >
                                        {selectedTechnique.url}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border border-vscode-border rounded-md bg-vscode-bg">
                            <p className="text-vscode-text-secondary">{t('selectTechniqueToViewDetails')}</p>
                        </div>
                    )}
                </div>
            </div>
            {errorModal.isOpen && (
                <ErrorModal
                    message={errorModal.message}
                    onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                />
            )}
            {successModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSuccessModal({ ...successModal, isOpen: false })}>
                    <div className="bg-vscode-bg-sidebar border border-green-500 rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-vscode-border flex items-center space-x-2 bg-green-900/20 rounded-t-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-lg font-bold text-green-500">Success</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-vscode-text-primary">{successModal.message}</p>
                        </div>
                        <div className="flex justify-end space-x-4 p-4 border-t border-vscode-border bg-vscode-bg-sidebar rounded-b-lg">
                            <button
                                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                                className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
