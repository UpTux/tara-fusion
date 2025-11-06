import React, { useMemo, useState } from 'react';
import { Emb3dAsset } from '../../services/emb3dService';

interface Emb3dAssetModalProps {
    availableAssets: Emb3dAsset[];
    onConfirm: (selectedAssets: Emb3dAsset[]) => void;
    onClose: () => void;
}

export const Emb3dAssetModal: React.FC<Emb3dAssetModalProps> = ({
    availableAssets,
    onConfirm,
    onClose
}) => {
    const [selectedAssetNames, setSelectedAssetNames] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = useMemo(() => {
        const cats = new Set<string>(['All']);
        availableAssets.forEach(asset => {
            if (asset.category) cats.add(asset.category);
        });
        return Array.from(cats);
    }, [availableAssets]);

    const filteredAssets = useMemo(() => {
        return availableAssets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [availableAssets, searchTerm, selectedCategory]);

    const handleToggle = (assetName: string) => {
        const newSelected = new Set(selectedAssetNames);
        if (newSelected.has(assetName)) {
            newSelected.delete(assetName);
        } else {
            newSelected.add(assetName);
        }
        setSelectedAssetNames(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedAssetNames.size === filteredAssets.length) {
            setSelectedAssetNames(new Set());
        } else {
            setSelectedAssetNames(new Set(filteredAssets.map(a => a.name)));
        }
    };

    const handleConfirm = () => {
        const selected = availableAssets.filter(a => selectedAssetNames.has(a.name));
        onConfirm(selected);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Import from MITRE Emb3d</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Select embedded system assets to import into your project
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mt-4 flex gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Select All */}
                    <div className="mt-3 flex items-center justify-between">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            {selectedAssetNames.size === filteredAssets.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-sm text-gray-400">
                            {selectedAssetNames.size} selected
                        </span>
                    </div>
                </div>

                {/* Asset List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-2">
                        {filteredAssets.map(asset => (
                            <label
                                key={asset.name}
                                className="flex items-start p-3 bg-gray-800/50 hover:bg-gray-800 rounded-md cursor-pointer transition-colors border border-gray-700/50"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedAssetNames.has(asset.name)}
                                    onChange={() => handleToggle(asset.name)}
                                    className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{asset.name}</span>
                                        {asset.category && (
                                            <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                                                {asset.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{asset.description}</p>
                                    <div className="flex gap-2 mt-2">
                                        {asset.properties.confidentiality && (
                                            <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-300 rounded">
                                                Confidentiality
                                            </span>
                                        )}
                                        {asset.properties.integrity && (
                                            <span className="px-2 py-0.5 text-xs bg-green-600/20 text-green-300 rounded">
                                                Integrity
                                            </span>
                                        )}
                                        {asset.properties.availability && (
                                            <span className="px-2 py-0.5 text-xs bg-orange-600/20 text-orange-300 rounded">
                                                Availability
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedAssetNames.size === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Import {selectedAssetNames.size > 0 ? `(${selectedAssetNames.size})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};
