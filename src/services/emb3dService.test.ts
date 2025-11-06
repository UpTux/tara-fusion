import { describe, expect, it } from 'vitest';
import { SecurityProperty, type Asset, type Threat } from '../types';
import {
    convertEmb3dAssetToTaraAsset,
    convertEmb3dAssetsToTaraAssets,
    convertEmb3dThreatToTaraThreat,
    convertEmb3dThreatsToTaraThreats,
    getEmb3dAssets,
    getEmb3dThreats,
    getThreatsForAsset,
    getThreatsForDeviceProperty,
    importEmb3dAssetWithThreats,
    type Emb3dAsset,
    type Emb3dThreat
} from './emb3dService';

describe('emb3dService', () => {
    describe('getEmb3dAssets', () => {
        it('should return an array of Emb3d assets', () => {
            const assets = getEmb3dAssets();

            expect(assets).toBeInstanceOf(Array);
            expect(assets.length).toBeGreaterThan(0);
        });

        it('should return 49 device properties', () => {
            const assets = getEmb3dAssets();

            expect(assets.length).toBe(49);
        });

        it('should have correct structure for each asset', () => {
            const assets = getEmb3dAssets();
            const firstAsset = assets[0];

            expect(firstAsset).toHaveProperty('id');
            expect(firstAsset).toHaveProperty('name');
            expect(firstAsset).toHaveProperty('description');
            expect(firstAsset).toHaveProperty('category');
            expect(firstAsset).toHaveProperty('threats');
            expect(firstAsset).toHaveProperty('properties');

            expect(typeof firstAsset.id).toBe('string');
            expect(typeof firstAsset.name).toBe('string');
            expect(typeof firstAsset.description).toBe('string');
            expect(typeof firstAsset.category).toBe('string');
            expect(Array.isArray(firstAsset.threats)).toBe(true);
            expect(typeof firstAsset.properties).toBe('object');
        });

        it('should have security properties with boolean values', () => {
            const assets = getEmb3dAssets();
            const firstAsset = assets[0];

            expect(typeof firstAsset.properties.confidentiality).toBe('boolean');
            expect(typeof firstAsset.properties.integrity).toBe('boolean');
            expect(typeof firstAsset.properties.availability).toBe('boolean');
        });

        it('should categorize hardware assets correctly (PID-1x)', () => {
            const assets = getEmb3dAssets();
            const hardwareAssets = assets.filter(a => a.id.startsWith('PID-1'));

            hardwareAssets.forEach(asset => {
                expect(asset.category).toBe('Hardware');
            });
        });

        it('should categorize software assets correctly (PID-2x)', () => {
            const assets = getEmb3dAssets();
            const softwareAssets = assets.filter(a => a.id.startsWith('PID-2'));

            softwareAssets.forEach(asset => {
                expect(asset.category).toBe('Software');
            });
        });

        it('should categorize application assets correctly (PID-3x)', () => {
            const assets = getEmb3dAssets();
            const applicationAssets = assets.filter(a => a.id.startsWith('PID-3'));

            applicationAssets.forEach(asset => {
                expect(asset.category).toBe('Application');
            });
        });

        it('should categorize network assets correctly (PID-4x)', () => {
            const assets = getEmb3dAssets();
            const networkAssets = assets.filter(a => a.id.startsWith('PID-4'));

            networkAssets.forEach(asset => {
                expect(asset.category).toBe('Network');
            });
        });

        it('should set integrity to true for all assets', () => {
            const assets = getEmb3dAssets();

            assets.forEach(asset => {
                expect(asset.properties.integrity).toBe(true);
            });
        });

        it('should detect confidentiality for cryptographic assets', () => {
            const assets = getEmb3dAssets();
            const cryptoAsset = assets.find(a => a.id === 'PID-272');

            expect(cryptoAsset).toBeDefined();
            expect(cryptoAsset?.properties.confidentiality).toBe(true);
        });

        it('should detect availability for network services', () => {
            const assets = getEmb3dAssets();
            const networkServiceAsset = assets.find(a => a.id === 'PID-41');

            expect(networkServiceAsset).toBeDefined();
            expect(networkServiceAsset?.properties.availability).toBe(true);
        });

        it('should include threats for each asset', () => {
            const assets = getEmb3dAssets();

            assets.forEach(asset => {
                expect(Array.isArray(asset.threats)).toBe(true);
                expect(asset.threats.length).toBeGreaterThan(0);

                asset.threats.forEach(threat => {
                    expect(threat).toHaveProperty('Threat ID');
                    expect(threat).toHaveProperty('Threat Description');
                    expect(typeof threat['Threat ID']).toBe('string');
                    expect(typeof threat['Threat Description']).toBe('string');
                });
            });
        });
    });

    describe('getEmb3dThreats', () => {
        it('should return an array of unique threats', () => {
            const threats = getEmb3dThreats();

            expect(threats).toBeInstanceOf(Array);
            expect(threats.length).toBeGreaterThan(0);
        });

        it('should return threats sorted by Threat ID', () => {
            const threats = getEmb3dThreats();

            for (let i = 1; i < threats.length; i++) {
                const prev = threats[i - 1]['Threat ID'];
                const curr = threats[i]['Threat ID'];
                expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
            }
        });

        it('should have no duplicate threat IDs', () => {
            const threats = getEmb3dThreats();
            const threatIds = threats.map(t => t['Threat ID']);
            const uniqueThreatIds = new Set(threatIds);

            expect(threatIds.length).toBe(uniqueThreatIds.size);
        });

        it('should have correct structure for each threat', () => {
            const threats = getEmb3dThreats();
            const firstThreat = threats[0];

            expect(firstThreat).toHaveProperty('Threat ID');
            expect(firstThreat).toHaveProperty('Threat Description');
            expect(typeof firstThreat['Threat ID']).toBe('string');
            expect(typeof firstThreat['Threat Description']).toBe('string');
            expect(firstThreat['Threat ID']).toMatch(/^TID-\d+$/);
        });

        it('should include all threats from all device properties', () => {
            const threats = getEmb3dThreats();
            const assets = getEmb3dAssets();

            // Collect all threat IDs from assets
            const assetThreatIds = new Set<string>();
            assets.forEach(asset => {
                asset.threats.forEach(threat => {
                    assetThreatIds.add(threat['Threat ID']);
                });
            });

            // All threat IDs from assets should be in the threats catalog
            const catalogThreatIds = new Set(threats.map(t => t['Threat ID']));
            assetThreatIds.forEach(id => {
                expect(catalogThreatIds.has(id)).toBe(true);
            });
        });
    });

    describe('getThreatsForDeviceProperty', () => {
        it('should return threats for a valid device property ID', () => {
            const threats = getThreatsForDeviceProperty('PID-11');

            expect(threats).toBeInstanceOf(Array);
            expect(threats.length).toBeGreaterThan(0);
        });

        it('should return empty array for invalid device property ID', () => {
            const threats = getThreatsForDeviceProperty('PID-999');

            expect(threats).toEqual([]);
        });

        it('should return empty array for empty string', () => {
            const threats = getThreatsForDeviceProperty('');

            expect(threats).toEqual([]);
        });

        it('should return correct threats for PID-11 (Microprocessor)', () => {
            const threats = getThreatsForDeviceProperty('PID-11');

            expect(threats.length).toBeGreaterThan(0);
            expect(threats.some(t => t['Threat ID'] === 'TID-101')).toBe(true);
        });

        it('should return threats with correct structure', () => {
            const threats = getThreatsForDeviceProperty('PID-11');

            threats.forEach(threat => {
                expect(threat).toHaveProperty('Threat ID');
                expect(threat).toHaveProperty('Threat Description');
                expect(typeof threat['Threat ID']).toBe('string');
                expect(typeof threat['Threat Description']).toBe('string');
            });
        });
    });

    describe('convertEmb3dAssetToTaraAsset', () => {
        const mockEmb3dAsset: Emb3dAsset = {
            id: 'PID-11',
            name: 'Microprocessor',
            description: 'Device includes a microprocessor',
            category: 'Hardware',
            threats: [
                { 'Threat ID': 'TID-101', 'Threat Description': 'Power Consumption Analysis Side Channel' }
            ],
            properties: {
                confidentiality: true,
                integrity: true,
                availability: true
            }
        };

        it('should convert Emb3d asset to TARA asset', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset).toHaveProperty('id');
            expect(taraAsset).toHaveProperty('name');
            expect(taraAsset).toHaveProperty('description');
            expect(taraAsset).toHaveProperty('securityProperties');
            expect(taraAsset).toHaveProperty('toeConfigurationIds');
            expect(taraAsset).toHaveProperty('comment');
        });

        it('should generate unique ID with correct format', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.id).toMatch(/^ASSET_\d{3}$/);
            expect(taraAsset.id).toBe('ASSET_001');
        });

        it('should avoid duplicate IDs', () => {
            const existingIds = ['ASSET_001', 'ASSET_002'];
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, existingIds, 1);

            expect(taraAsset.id).toBe('ASSET_003');
        });

        it('should preserve name and description', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.name).toBe(mockEmb3dAsset.name);
            expect(taraAsset.description).toBe(mockEmb3dAsset.description);
        });

        it('should map confidentiality security property', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.securityProperties).toContain(SecurityProperty.CONFIDENTIALITY);
        });

        it('should map integrity security property', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.securityProperties).toContain(SecurityProperty.INTEGRITY);
        });

        it('should map availability security property', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.securityProperties).toContain(SecurityProperty.AVAILABILITY);
        });

        it('should not map confidentiality if false', () => {
            const asset = { ...mockEmb3dAsset, properties: { ...mockEmb3dAsset.properties, confidentiality: false } };
            const taraAsset = convertEmb3dAssetToTaraAsset(asset, [], 1);

            expect(taraAsset.securityProperties).not.toContain(SecurityProperty.CONFIDENTIALITY);
        });

        it('should initialize toeConfigurationIds as empty array', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.toeConfigurationIds).toEqual([]);
        });

        it('should include device property ID in comment', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.comment).toContain('Device Property ID: PID-11');
        });

        it('should include category in comment', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.comment).toContain('Category: Hardware');
        });

        it('should include threats in comment', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.comment).toContain('Associated Threats (1)');
            expect(taraAsset.comment).toContain('TID-101');
            expect(taraAsset.comment).toContain('Power Consumption Analysis Side Channel');
        });

        it('should include MITRE Emb3d marker in comment', () => {
            const taraAsset = convertEmb3dAssetToTaraAsset(mockEmb3dAsset, [], 1);

            expect(taraAsset.comment).toContain('Imported from MITRE Emb3d');
        });

        it('should handle assets without category', () => {
            const asset = { ...mockEmb3dAsset, category: undefined };
            const taraAsset = convertEmb3dAssetToTaraAsset(asset, [], 1);

            expect(taraAsset.comment).toContain('Category: Other');
        });

        it('should handle multiple threats in comment', () => {
            const asset = {
                ...mockEmb3dAsset,
                threats: [
                    { 'Threat ID': 'TID-101', 'Threat Description': 'Threat 1' },
                    { 'Threat ID': 'TID-102', 'Threat Description': 'Threat 2' }
                ]
            };
            const taraAsset = convertEmb3dAssetToTaraAsset(asset, [], 1);

            expect(taraAsset.comment).toContain('Associated Threats (2)');
            expect(taraAsset.comment).toContain('TID-101');
            expect(taraAsset.comment).toContain('TID-102');
        });
    });

    describe('convertEmb3dAssetsToTaraAssets', () => {
        const mockEmb3dAssets: Emb3dAsset[] = [
            {
                id: 'PID-11',
                name: 'Microprocessor',
                description: 'Device includes a microprocessor',
                category: 'Hardware',
                threats: [{ 'Threat ID': 'TID-101', 'Threat Description': 'Test threat' }],
                properties: { confidentiality: true, integrity: true, availability: true }
            },
            {
                id: 'PID-21',
                name: 'Bootloader',
                description: 'Device includes a bootloader',
                category: 'Software',
                threats: [{ 'Threat ID': 'TID-201', 'Threat Description': 'Test threat' }],
                properties: { confidentiality: false, integrity: true, availability: true }
            }
        ];

        const mockExistingAssets: Asset[] = [
            {
                id: 'ASSET_001',
                name: 'Existing Asset',
                description: 'Test',
                securityProperties: [SecurityProperty.INTEGRITY],
                toeConfigurationIds: [],
                comment: ''
            }
        ];

        it('should convert multiple Emb3d assets to TARA assets', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, []);

            expect(taraAssets.length).toBe(2);
        });

        it('should generate sequential IDs starting from 1 when no existing assets', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, []);

            expect(taraAssets[0].id).toBe('ASSET_001');
            expect(taraAssets[1].id).toBe('ASSET_002');
        });

        it('should generate IDs that do not conflict with existing assets', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, mockExistingAssets);

            expect(taraAssets[0].id).toBe('ASSET_002');
            expect(taraAssets[1].id).toBe('ASSET_003');
        });

        it('should preserve order of input assets', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, []);

            expect(taraAssets[0].name).toBe('Microprocessor');
            expect(taraAssets[1].name).toBe('Bootloader');
        });

        it('should handle empty input array', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets([], []);

            expect(taraAssets).toEqual([]);
        });

        it('should handle empty existing assets array', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, []);

            expect(taraAssets.length).toBe(2);
            expect(taraAssets[0].id).toBe('ASSET_001');
        });

        it('should convert all properties correctly for each asset', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, []);

            taraAssets.forEach((asset, index) => {
                expect(asset.name).toBe(mockEmb3dAssets[index].name);
                expect(asset.description).toBe(mockEmb3dAssets[index].description);
                expect(asset.comment).toContain('MITRE Emb3d');
            });
        });

        it('should ensure all generated IDs are unique', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, mockExistingAssets);
            const ids = taraAssets.map(a => a.id);
            const uniqueIds = new Set(ids);

            expect(ids.length).toBe(uniqueIds.size);
        });

        it('should not include existing asset IDs in new assets', () => {
            const taraAssets = convertEmb3dAssetsToTaraAssets(mockEmb3dAssets, mockExistingAssets);

            taraAssets.forEach(asset => {
                expect(asset.id).not.toBe('ASSET_001');
            });
        });
    });

    describe('Integration tests', () => {
        it('should convert all assets from getEmb3dAssets to TARA assets', () => {
            const emb3dAssets = getEmb3dAssets();
            const taraAssets = convertEmb3dAssetsToTaraAssets(emb3dAssets, []);

            expect(taraAssets.length).toBe(emb3dAssets.length);
            expect(taraAssets.length).toBe(49);
        });

        it('should maintain data integrity during conversion', () => {
            const emb3dAssets = getEmb3dAssets();
            const taraAssets = convertEmb3dAssetsToTaraAssets(emb3dAssets, []);

            emb3dAssets.forEach((emb3dAsset, index) => {
                const taraAsset = taraAssets[index];
                expect(taraAsset.name).toBe(emb3dAsset.name);
                expect(taraAsset.description).toBe(emb3dAsset.description);
            });
        });

        it('should have all security properties correctly mapped', () => {
            const emb3dAssets = getEmb3dAssets();
            const taraAssets = convertEmb3dAssetsToTaraAssets(emb3dAssets, []);

            emb3dAssets.forEach((emb3dAsset, index) => {
                const taraAsset = taraAssets[index];

                if (emb3dAsset.properties.confidentiality) {
                    expect(taraAsset.securityProperties).toContain(SecurityProperty.CONFIDENTIALITY);
                }
                if (emb3dAsset.properties.integrity) {
                    expect(taraAsset.securityProperties).toContain(SecurityProperty.INTEGRITY);
                }
                if (emb3dAsset.properties.availability) {
                    expect(taraAsset.securityProperties).toContain(SecurityProperty.AVAILABILITY);
                }
            });
        });

        it('should mark assets with source as emb3d', () => {
            const emb3dAssets = getEmb3dAssets();
            const taraAssets = convertEmb3dAssetsToTaraAssets(emb3dAssets, []);

            taraAssets.forEach(asset => {
                expect(asset.source).toBe('emb3d');
            });
        });

        it('should include emb3dPropertyId for all assets', () => {
            const emb3dAssets = getEmb3dAssets();
            const taraAssets = convertEmb3dAssetsToTaraAssets(emb3dAssets, []);

            taraAssets.forEach((asset, index) => {
                expect(asset.emb3dPropertyId).toBe(emb3dAssets[index].id);
            });
        });
    });

    describe('Threat Conversion', () => {
        const mockEmb3dThreat: Emb3dThreat = {
            'Threat ID': 'TID-101',
            'Threat Description': 'Power Consumption Analysis Side Channel'
        };

        const mockEmb3dAsset: Emb3dAsset = {
            id: 'PID-11',
            name: 'Microprocessor',
            description: 'Device includes a microprocessor',
            category: 'Hardware',
            threats: [mockEmb3dThreat],
            properties: {
                confidentiality: true,
                integrity: true,
                availability: true
            }
        };

        describe('convertEmb3dThreatToTaraThreat', () => {
            it('should convert Emb3d threat to TARA threat', () => {
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.CONFIDENTIALITY, SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat).toHaveProperty('id');
                expect(taraThreat).toHaveProperty('name');
                expect(taraThreat).toHaveProperty('assetId');
                expect(taraThreat).toHaveProperty('securityProperty');
                expect(taraThreat).toHaveProperty('source');
                expect(taraThreat).toHaveProperty('emb3dThreatId');
            });

            it('should generate unique ID with correct format', () => {
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.id).toMatch(/^THR_\d{3}$/);
                expect(taraThreat.id).toBe('THR_001');
            });

            it('should avoid duplicate IDs', () => {
                const existingIds = ['THR_001', 'THR_002'];
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.INTEGRITY],
                    existingIds,
                    1
                );

                expect(taraThreat.id).toBe('THR_003');
            });

            it('should mark threat source as emb3d', () => {
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.source).toBe('emb3d');
            });

            it('should include emb3dThreatId', () => {
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.emb3dThreatId).toBe('TID-101');
            });

            it('should set correct assetId', () => {
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.assetId).toBe('ASSET_001');
            });

            it('should preserve threat name', () => {
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.name).toBe('Power Consumption Analysis Side Channel');
            });

            it('should initialize with TBD AFR values', () => {
                const taraThreat = convertEmb3dThreatToTaraThreat(
                    mockEmb3dThreat,
                    'ASSET_001',
                    [SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.initialAFR).toBe('TBD');
                expect(taraThreat.residualAFR).toBe('TBD');
            });

            it('should map confidentiality threats correctly', () => {
                const confidentialityThreat: Emb3dThreat = {
                    'Threat ID': 'TID-108',
                    'Threat Description': 'ROM/NVRAM Data Extraction or Modification'
                };

                const taraThreat = convertEmb3dThreatToTaraThreat(
                    confidentialityThreat,
                    'ASSET_001',
                    [SecurityProperty.CONFIDENTIALITY, SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.securityProperty).toBe(SecurityProperty.CONFIDENTIALITY);
            });

            it('should map availability threats correctly', () => {
                const availabilityThreat: Emb3dThreat = {
                    'Threat ID': 'TID-217',
                    'Threat Description': 'Remotely Initiated Updates Can Cause DoS'
                };

                const taraThreat = convertEmb3dThreatToTaraThreat(
                    availabilityThreat,
                    'ASSET_001',
                    [SecurityProperty.AVAILABILITY, SecurityProperty.INTEGRITY],
                    [],
                    1
                );

                expect(taraThreat.securityProperty).toBe(SecurityProperty.AVAILABILITY);
            });
        });

        describe('convertEmb3dThreatsToTaraThreats', () => {
            it('should convert all threats from an Emb3d asset', () => {
                const assetWithMultipleThreats: Emb3dAsset = {
                    ...mockEmb3dAsset,
                    threats: [
                        { 'Threat ID': 'TID-101', 'Threat Description': 'Threat 1' },
                        { 'Threat ID': 'TID-102', 'Threat Description': 'Threat 2' }
                    ]
                };

                const taraThreats = convertEmb3dThreatsToTaraThreats(
                    assetWithMultipleThreats,
                    'ASSET_001',
                    []
                );

                expect(taraThreats.length).toBe(2);
            });

            it('should generate sequential IDs for threats', () => {
                const assetWithMultipleThreats: Emb3dAsset = {
                    ...mockEmb3dAsset,
                    threats: [
                        { 'Threat ID': 'TID-101', 'Threat Description': 'Threat 1' },
                        { 'Threat ID': 'TID-102', 'Threat Description': 'Threat 2' }
                    ]
                };

                const taraThreats = convertEmb3dThreatsToTaraThreats(
                    assetWithMultipleThreats,
                    'ASSET_001',
                    []
                );

                expect(taraThreats[0].id).toBe('THR_001');
                expect(taraThreats[1].id).toBe('THR_002');
            });

            it('should avoid conflicts with existing threats', () => {
                const existingThreats: Threat[] = [
                    {
                        id: 'THR_001',
                        name: 'Existing Threat',
                        assetId: 'ASSET_001',
                        securityProperty: SecurityProperty.INTEGRITY,
                        damageScenarioIds: [],
                        scales: false,
                        reasoningScaling: '',
                        comment: '',
                        initialAFR: 'TBD',
                        residualAFR: 'TBD'
                    }
                ];

                const taraThreats = convertEmb3dThreatsToTaraThreats(
                    mockEmb3dAsset,
                    'ASSET_001',
                    existingThreats
                );

                expect(taraThreats[0].id).toBe('THR_002');
            });

            it('should mark all threats as emb3d source', () => {
                const assetWithMultipleThreats: Emb3dAsset = {
                    ...mockEmb3dAsset,
                    threats: [
                        { 'Threat ID': 'TID-101', 'Threat Description': 'Threat 1' },
                        { 'Threat ID': 'TID-102', 'Threat Description': 'Threat 2' }
                    ]
                };

                const taraThreats = convertEmb3dThreatsToTaraThreats(
                    assetWithMultipleThreats,
                    'ASSET_001',
                    []
                );

                taraThreats.forEach(threat => {
                    expect(threat.source).toBe('emb3d');
                });
            });
        });

        describe('getThreatsForAsset', () => {
            it('should return threats for Emb3d assets', () => {
                const emb3dAsset: Asset = {
                    id: 'ASSET_001',
                    name: 'Microprocessor',
                    description: 'Test',
                    securityProperties: [SecurityProperty.INTEGRITY],
                    toeConfigurationIds: [],
                    comment: '',
                    source: 'emb3d',
                    emb3dPropertyId: 'PID-11'
                };

                const threats = getThreatsForAsset(emb3dAsset);

                expect(threats.length).toBeGreaterThan(0);
            });

            it('should return empty array for manual assets', () => {
                const manualAsset: Asset = {
                    id: 'ASSET_001',
                    name: 'Custom Asset',
                    description: 'Test',
                    securityProperties: [SecurityProperty.INTEGRITY],
                    toeConfigurationIds: [],
                    comment: '',
                    source: 'manual'
                };

                const threats = getThreatsForAsset(manualAsset);

                expect(threats).toEqual([]);
            });

            it('should return empty array for assets without source', () => {
                const asset: Asset = {
                    id: 'ASSET_001',
                    name: 'Asset',
                    description: 'Test',
                    securityProperties: [SecurityProperty.INTEGRITY],
                    toeConfigurationIds: [],
                    comment: ''
                };

                const threats = getThreatsForAsset(asset);

                expect(threats).toEqual([]);
            });
        });

        describe('importEmb3dAssetWithThreats - Complete Workflow Demo', () => {
            it('should import Microprocessor (PID-11) with all 4 threats', () => {
                const result = importEmb3dAssetWithThreats('PID-11', [], []);

                // Verify the asset
                expect(result.asset.name).toBe('Microprocessor');
                expect(result.asset.source).toBe('emb3d');
                expect(result.asset.emb3dPropertyId).toBe('PID-11');
                expect(result.asset.id).toBe('ASSET_001');

                // Verify the threats
                expect(result.threats.length).toBe(4);

                // Verify each threat matches the expected MITRE Emb3d threats
                const threatDetails = result.threats.map(t => ({
                    id: t.emb3dThreatId,
                    description: t.name
                }));

                expect(threatDetails).toEqual([
                    { id: 'TID-101', description: 'Power Consumption Analysis Side Channel' },
                    { id: 'TID-102', description: 'Electromagnetic Analysis Side Channel' },
                    { id: 'TID-103', description: 'Microarchitectural Side Channels' },
                    { id: 'TID-105', description: 'Hardware Fault Injection – Control Flow Modification' }
                ]);

                // Verify all threats are tagged correctly
                result.threats.forEach(threat => {
                    expect(threat.source).toBe('emb3d');
                    expect(threat.assetId).toBe('ASSET_001');
                    expect(threat.initialAFR).toBe('TBD');
                    expect(threat.residualAFR).toBe('TBD');
                });
            });

            it('should generate sequential IDs for threats', () => {
                const result = importEmb3dAssetWithThreats('PID-11', [], []);

                expect(result.threats[0].id).toBe('THR_001');
                expect(result.threats[1].id).toBe('THR_002');
                expect(result.threats[2].id).toBe('THR_003');
                expect(result.threats[3].id).toBe('THR_004');
            });

            it('should avoid ID conflicts with existing assets and threats', () => {
                const existingAssets: Asset[] = [
                    {
                        id: 'ASSET_001',
                        name: 'Existing Asset',
                        description: 'Test',
                        securityProperties: [SecurityProperty.INTEGRITY],
                        toeConfigurationIds: [],
                        comment: ''
                    }
                ];

                const existingThreats: Threat[] = [
                    {
                        id: 'THR_001',
                        name: 'Existing Threat',
                        assetId: 'ASSET_001',
                        securityProperty: SecurityProperty.INTEGRITY,
                        damageScenarioIds: [],
                        scales: false,
                        reasoningScaling: '',
                        comment: '',
                        initialAFR: 'TBD',
                        residualAFR: 'TBD'
                    }
                ];

                const result = importEmb3dAssetWithThreats('PID-11', existingAssets, existingThreats);

                // Asset should get next available ID
                expect(result.asset.id).toBe('ASSET_002');

                // Threats should start from THR_002
                expect(result.threats[0].id).toBe('THR_002');
                expect(result.threats[1].id).toBe('THR_003');
                expect(result.threats[2].id).toBe('THR_004');
                expect(result.threats[3].id).toBe('THR_005');
            });

            it('should import Bootloader (PID-21) with its threat', () => {
                const result = importEmb3dAssetWithThreats('PID-21', [], []);

                expect(result.asset.name).toBe('Bootloader');
                expect(result.asset.emb3dPropertyId).toBe('PID-21');
                expect(result.threats.length).toBe(1);
                expect(result.threats[0].emb3dThreatId).toBe('TID-201');
                expect(result.threats[0].name).toBe('Inadequate Bootloader Protection and Verification');
            });

            it('should import Operating System (PID-23) with its threats', () => {
                const result = importEmb3dAssetWithThreats('PID-23', [], []);

                expect(result.asset.name).toBe('Operating System');
                expect(result.threats.length).toBe(2);
                expect(result.threats[0].emb3dThreatId).toBe('TID-202');
                expect(result.threats[1].emb3dThreatId).toBe('TID-218');
            });

            it('should throw error for invalid device property ID', () => {
                expect(() => {
                    importEmb3dAssetWithThreats('PID-999', [], []);
                }).toThrow('Device property PID-999 not found in Emb3d catalog');
            });

            it('should include threat details in asset comment', () => {
                const result = importEmb3dAssetWithThreats('PID-11', [], []);

                expect(result.asset.comment).toContain('Device Property ID: PID-11');
                expect(result.asset.comment).toContain('Category: Hardware');
                expect(result.asset.comment).toContain('Associated Threats (4)');
                expect(result.asset.comment).toContain('TID-101: Power Consumption Analysis Side Channel');
                expect(result.asset.comment).toContain('Imported from MITRE Emb3d');
            });
        });
    });
});
