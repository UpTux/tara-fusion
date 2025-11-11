import React, { useState } from 'react';
import { extractAssetsFromTerraformFile, getTerraformResourceStats, parseTerraformContent } from '../../services/terraformService';
import { Asset } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { InformationCircleIcon } from '../icons/InformationCircleIcon';

interface TerraformImportModalProps {
    onClose: () => void;
    onImport: (assets: Asset[]) => void;
    toeConfigurationIds?: string[];
}

export const TerraformImportModal: React.FC<TerraformImportModalProps> = ({
    onClose,
    onImport,
    toeConfigurationIds = [],
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedAssets, setParsedAssets] = useState<Asset[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{ totalResources: number; byCategory: Record<string, number>; byType: Record<string, number> } | null>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file extension
        if (!file.name.endsWith('.tf') && !file.name.endsWith('.tf.json')) {
            setError('Please select a valid Terraform file (.tf or .tf.json)');
            return;
        }

        setSelectedFile(file);
        setLoading(true);
        setError(null);

        try {
            // Parse and extract assets
            const assets = await extractAssetsFromTerraformFile(file, toeConfigurationIds);
            setParsedAssets(assets);

            // Select all assets by default
            setSelectedAssets(new Set(assets.map(a => a.id)));

            // Parse for statistics
            const content = await file.text();
            const parseResult = parseTerraformContent(content);
            const resourceStats = getTerraformResourceStats(parseResult.resources);
            setStats(resourceStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse Terraform file');
            setParsedAssets([]);
            setSelectedAssets(new Set());
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAsset = (assetId: string) => {
        const newSelected = new Set(selectedAssets);
        if (newSelected.has(assetId)) {
            newSelected.delete(assetId);
        } else {
            newSelected.add(assetId);
        }
        setSelectedAssets(newSelected);
    };

    const handleToggleAll = () => {
        if (selectedAssets.size === parsedAssets.length) {
            setSelectedAssets(new Set());
        } else {
            setSelectedAssets(new Set(parsedAssets.map(a => a.id)));
        }
    };

    const handleImport = () => {
        const assetsToImport = parsedAssets.filter(a => selectedAssets.has(a.id));
        onImport(assetsToImport);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-vscode-bg-sidebar rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-vscode-border">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-vscode-border">
                    <div className="flex items-center gap-3">
                        <DownloadIcon className="w-6 h-6 text-blue-400" />
                        <h2 className="text-2xl font-bold text-vscode-text-primary">Import from Terraform</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-vscode-bg-hover rounded transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-5 h-5 text-vscode-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Info banner */}
                    <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-md flex gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-vscode-text-secondary">
                            <p className="font-medium text-vscode-text-primary mb-1">Terraform Infrastructure Import</p>
                            <p>Upload a Terraform file (.tf) to automatically extract infrastructure assets. The tool will identify compute, database, storage, network, and security resources and assign appropriate security properties.</p>
                        </div>
                    </div>

                    {/* File selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-vscode-text-primary mb-2">
                            Select Terraform File
                        </label>
                        <input
                            type="file"
                            accept=".tf,.tf.json"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-vscode-text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-700 file:text-white
                hover:file:bg-blue-600
                file:cursor-pointer cursor-pointer"
                        />
                        {selectedFile && (
                            <p className="mt-2 text-sm text-vscode-text-secondary">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="mt-2 text-sm text-vscode-text-secondary">Parsing Terraform file...</p>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-md">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Statistics */}
                    {stats && stats.totalResources > 0 && (
                        <div className="mb-6 p-4 bg-vscode-bg-hover rounded-md">
                            <h3 className="text-sm font-semibold text-vscode-text-primary mb-3">Resource Statistics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-vscode-text-secondary mb-2">Total Resources</p>
                                    <p className="text-2xl font-bold text-blue-400">{stats.totalResources}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-vscode-text-secondary mb-2">By Category</p>
                                    <div className="space-y-1">
                                        {Object.entries(stats.byCategory).map(([category, count]) => (
                                            <div key={category} className="flex justify-between text-sm">
                                                <span className="text-vscode-text-secondary">{category}:</span>
                                                <span className="text-vscode-text-primary font-medium">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assets list */}
                    {parsedAssets.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-semibold text-vscode-text-primary">
                                    Extracted Assets ({selectedAssets.size} of {parsedAssets.length} selected)
                                </h3>
                                <button
                                    onClick={handleToggleAll}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    {selectedAssets.size === parsedAssets.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="border border-vscode-border rounded-md max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-vscode-bg-sidebar border-b border-vscode-border">
                                        <tr>
                                            <th className="p-3 text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssets.size === parsedAssets.length}
                                                    onChange={handleToggleAll}
                                                    className="rounded"
                                                />
                                            </th>
                                            <th className="p-3 text-left font-semibold text-vscode-text-primary">Name</th>
                                            <th className="p-3 text-left font-semibold text-vscode-text-primary">Security Properties</th>
                                            <th className="p-3 text-left font-semibold text-vscode-text-primary">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedAssets.map((asset) => (
                                            <tr
                                                key={asset.id}
                                                className={`border-b border-vscode-border hover:bg-vscode-bg-hover cursor-pointer ${selectedAssets.has(asset.id) ? 'bg-blue-900/10' : ''
                                                    }`}
                                                onClick={() => handleToggleAsset(asset.id)}
                                            >
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAssets.has(asset.id)}
                                                        onChange={() => handleToggleAsset(asset.id)}
                                                        className="rounded"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className="p-3 text-vscode-text-primary font-medium">{asset.name}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {asset.securityProperties.map(prop => (
                                                            <span
                                                                key={prop}
                                                                className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-xs"
                                                            >
                                                                {prop}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-vscode-text-secondary text-xs">
                                                    {asset.description.substring(0, 100)}
                                                    {asset.description.length > 100 ? '...' : ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* No assets found */}
                    {!loading && !error && parsedAssets.length === 0 && selectedFile && (
                        <div className="text-center py-8">
                            <InformationCircleIcon className="w-12 h-12 text-vscode-text-secondary mx-auto mb-3" />
                            <p className="text-vscode-text-secondary">No infrastructure resources found in this file.</p>
                            <p className="text-sm text-vscode-text-secondary mt-2">
                                Make sure the file contains resource definitions (e.g., aws_instance, azurerm_virtual_machine, etc.)
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-vscode-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-medium text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={selectedAssets.size === 0 || loading}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Import {selectedAssets.size} Asset{selectedAssets.size !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};
