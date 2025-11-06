import emb3dPropertiesData from '../../assets/emb3d_properties.json';
import { Asset, SecurityProperty, Threat } from '../types';

/**
 * MITRE Emb3d Device Property
 * Based on the emb3d_properties.json file
 */
export interface Emb3dDeviceProperty {
    'Device Property ID': string;
    'Device Property Description': string;
    asset: string;
    threats: Emb3dThreat[];
}

/**
 * MITRE Emb3d Threat
 */
export interface Emb3dThreat {
    'Threat ID': string;
    'Threat Description': string;
}

/**
 * MITRE Emb3d Asset Properties
 * Based on the emb3d_properties.json file
 */
export interface Emb3dAsset {
    id: string;
    name: string;
    description: string;
    category?: string;
    threats: Emb3dThreat[];
    properties: {
        confidentiality?: boolean;
        integrity?: boolean;
        availability?: boolean;
    };
}

/**
 * Determine the category of an asset based on its ID and description
 */
const determineCategory = (id: string, description: string): string => {
    // Hardware category: PID-1x (Hardware components)
    if (id.startsWith('PID-1')) {
        return 'Hardware';
    }
    // Software/Firmware category: PID-2x (System software, OS, bootloader, etc.)
    if (id.startsWith('PID-2')) {
        return 'Software';
    }
    // Application category: PID-3x (Application-level software)
    if (id.startsWith('PID-3')) {
        return 'Application';
    }
    // Network category: PID-4x (Network services and protocols)
    if (id.startsWith('PID-4')) {
        return 'Network';
    }
    return 'Other';
};

/**
 * Determine security properties based on the asset description and threats
 */
const determineSecurityProperties = (description: string, threats: Emb3dThreat[]): {
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
} => {
    const desc = description.toLowerCase();
    const threatDescs = threats.map(t => t['Threat Description'].toLowerCase()).join(' ');

    // Confidentiality is typically relevant for:
    // - Cryptographic, authentication, encryption-related assets
    // - Memory, storage, data assets
    // - Communication interfaces
    const confidentiality =
        desc.includes('cryptographic') ||
        desc.includes('encryption') ||
        desc.includes('password') ||
        desc.includes('authentication') ||
        desc.includes('key') ||
        desc.includes('secret') ||
        desc.includes('memory') ||
        desc.includes('storage') ||
        desc.includes('data') ||
        desc.includes('log') ||
        threatDescs.includes('extract') ||
        threatDescs.includes('unencrypted') ||
        threatDescs.includes('credential');

    // Integrity is typically relevant for most assets
    const integrity = true;

    // Availability is typically relevant for:
    // - Services, network, runtime environments
    // - Update mechanisms, system components
    const availability =
        desc.includes('service') ||
        desc.includes('network') ||
        desc.includes('update') ||
        desc.includes('runtime') ||
        desc.includes('operating system') ||
        desc.includes('application') ||
        threatDescs.includes('dos') ||
        threatDescs.includes('denial') ||
        threatDescs.includes('resource exhaustion');

    return { confidentiality, integrity, availability };
};

/**
 * Parse the MITRE Emb3d properties from the JSON file
 */
export const getEmb3dAssets = (): Emb3dAsset[] => {
    const deviceProperties = emb3dPropertiesData as Emb3dDeviceProperty[];

    return deviceProperties.map(property => {
        const category = determineCategory(property['Device Property ID'], property['Device Property Description']);
        const securityProps = determineSecurityProperties(property['Device Property Description'], property.threats);

        return {
            id: property['Device Property ID'],
            name: property.asset,
            description: property['Device Property Description'],
            category,
            threats: property.threats,
            properties: securityProps
        };
    });
};

/**
 * Get all unique threats from the MITRE Emb3d catalog
 */
export const getEmb3dThreats = (): Emb3dThreat[] => {
    const deviceProperties = emb3dPropertiesData as Emb3dDeviceProperty[];
    const threatsMap = new Map<string, Emb3dThreat>();

    deviceProperties.forEach(property => {
        property.threats.forEach(threat => {
            threatsMap.set(threat['Threat ID'], threat);
        });
    });

    return Array.from(threatsMap.values()).sort((a, b) =>
        a['Threat ID'].localeCompare(b['Threat ID'])
    );
};

/**
 * Get threats for a specific device property
 */
export const getThreatsForDeviceProperty = (devicePropertyId: string): Emb3dThreat[] => {
    const deviceProperties = emb3dPropertiesData as Emb3dDeviceProperty[];
    const property = deviceProperties.find(p => p['Device Property ID'] === devicePropertyId);
    return property?.threats || [];
};

/**
 * Convert an Emb3d asset to a TARA Asset
 */
export const convertEmb3dAssetToTaraAsset = (
    emb3dAsset: Emb3dAsset,
    existingAssetIds: string[],
    startIndex: number = 1
): Asset => {
    // Generate unique ID
    let i = startIndex;
    let newId = `ASSET_${String(i).padStart(3, '0')}`;
    while (existingAssetIds.includes(newId)) {
        i++;
        newId = `ASSET_${String(i).padStart(3, '0')}`;
    }

    // Map properties
    const securityProperties: SecurityProperty[] = [];
    if (emb3dAsset.properties.confidentiality) {
        securityProperties.push(SecurityProperty.CONFIDENTIALITY);
    }
    if (emb3dAsset.properties.integrity) {
        securityProperties.push(SecurityProperty.INTEGRITY);
    }
    if (emb3dAsset.properties.availability) {
        securityProperties.push(SecurityProperty.AVAILABILITY);
    }

    return {
        id: newId,
        name: emb3dAsset.name,
        description: emb3dAsset.description,
        securityProperties,
        toeConfigurationIds: [],
        comment: `Device Property ID: ${emb3dAsset.id}\nCategory: ${emb3dAsset.category || 'Other'}\n\nAssociated Threats (${emb3dAsset.threats.length}):\n${emb3dAsset.threats.map(t => `- ${t['Threat ID']}: ${t['Threat Description']}`).join('\n')}\n\nImported from MITRE Emb3d`,
        source: 'emb3d',
        emb3dPropertyId: emb3dAsset.id
    };
};

/**
 * Convert multiple Emb3d assets to TARA assets
 */
export const convertEmb3dAssetsToTaraAssets = (
    selectedEmb3dAssets: Emb3dAsset[],
    existingAssets: Asset[]
): Asset[] => {
    const existingIds = existingAssets.map(a => a.id);
    let counter = existingAssets.length + 1;

    return selectedEmb3dAssets.map(emb3dAsset => {
        const asset = convertEmb3dAssetToTaraAsset(emb3dAsset, existingIds, counter);
        existingIds.push(asset.id);
        counter++;
        return asset;
    });
};

/**
 * Map security property from Emb3d threat to TARA security property
 * This uses heuristics based on threat descriptions
 */
const mapThreatToSecurityProperty = (
    threat: Emb3dThreat,
    assetSecurityProperties: SecurityProperty[]
): SecurityProperty => {
    const desc = threat['Threat Description'].toLowerCase();

    // Check for confidentiality-related threats
    if (
        desc.includes('extract') ||
        desc.includes('unencrypted') ||
        desc.includes('disclosure') ||
        desc.includes('intercept') ||
        desc.includes('readout') ||
        desc.includes('leak') ||
        desc.includes('secrets')
    ) {
        if (assetSecurityProperties.includes(SecurityProperty.CONFIDENTIALITY)) {
            return SecurityProperty.CONFIDENTIALITY;
        }
    }

    // Check for availability-related threats
    if (
        desc.includes('dos') ||
        desc.includes('denial') ||
        desc.includes('exhaustion') ||
        desc.includes('disable') ||
        desc.includes('unpatchable')
    ) {
        if (assetSecurityProperties.includes(SecurityProperty.AVAILABILITY)) {
            return SecurityProperty.AVAILABILITY;
        }
    }

    // Default to integrity if available, otherwise first security property
    if (assetSecurityProperties.includes(SecurityProperty.INTEGRITY)) {
        return SecurityProperty.INTEGRITY;
    }

    return assetSecurityProperties[0] || SecurityProperty.INTEGRITY;
};

/**
 * Convert an Emb3d threat to a TARA Threat for a given asset
 */
export const convertEmb3dThreatToTaraThreat = (
    emb3dThreat: Emb3dThreat,
    assetId: string,
    assetSecurityProperties: SecurityProperty[],
    existingThreatIds: string[],
    startIndex: number = 1
): Threat => {
    // Generate unique ID
    let i = startIndex;
    let newId = `THR_${String(i).padStart(3, '0')}`;
    while (existingThreatIds.includes(newId)) {
        i++;
        newId = `THR_${String(i).padStart(3, '0')}`;
    }

    // Map threat to appropriate security property
    const securityProperty = mapThreatToSecurityProperty(emb3dThreat, assetSecurityProperties);

    return {
        id: newId,
        name: emb3dThreat['Threat Description'],
        assetId,
        securityProperty,
        damageScenarioIds: [],
        scales: false,
        reasoningScaling: '',
        comment: `MITRE Emb3d Threat ID: ${emb3dThreat['Threat ID']}\n\nImported from MITRE Emb3d threat catalog.`,
        initialAFR: 'TBD',
        residualAFR: 'TBD',
        source: 'emb3d',
        emb3dThreatId: emb3dThreat['Threat ID']
    };
};

/**
 * Convert all threats from an Emb3d asset to TARA threats
 */
export const convertEmb3dThreatsToTaraThreats = (
    emb3dAsset: Emb3dAsset,
    taraAssetId: string,
    existingThreats: Threat[]
): Threat[] => {
    const existingIds = existingThreats.map(t => t.id);
    let counter = existingThreats.length + 1;

    return emb3dAsset.threats.map(emb3dThreat => {
        const threat = convertEmb3dThreatToTaraThreat(
            emb3dThreat,
            taraAssetId,
            emb3dAsset.properties.confidentiality || emb3dAsset.properties.integrity || emb3dAsset.properties.availability
                ? Object.entries(emb3dAsset.properties)
                    .filter(([_, value]) => value)
                    .map(([key]) => {
                        switch (key) {
                            case 'confidentiality': return SecurityProperty.CONFIDENTIALITY;
                            case 'integrity': return SecurityProperty.INTEGRITY;
                            case 'availability': return SecurityProperty.AVAILABILITY;
                            default: return SecurityProperty.INTEGRITY;
                        }
                    })
                : [SecurityProperty.INTEGRITY],
            existingIds,
            counter
        );
        existingIds.push(threat.id);
        counter++;
        return threat;
    });
};

/**
 * Get threats for an asset based on its source
 * For Emb3d assets, return threats from the catalog
 * For manual assets, return empty array (to be filled by AI generation)
 */
export const getThreatsForAsset = (asset: Asset): Emb3dThreat[] => {
    if (asset.source === 'emb3d' && asset.emb3dPropertyId) {
        return getThreatsForDeviceProperty(asset.emb3dPropertyId);
    }
    return [];
};

/**
 * DEMONSTRATION: Complete workflow when user selects an Emb3d asset
 * 
 * Example: User selects "Microprocessor" (PID-11)
 * 
 * This function demonstrates the complete flow:
 * 1. Get the Emb3d asset by ID
 * 2. Convert it to a TARA asset
 * 3. Generate all threats from the Emb3d catalog
 * 
 * @param devicePropertyId - The MITRE Emb3d device property ID (e.g., "PID-11")
 * @param existingAssets - List of existing assets in the project
 * @param existingThreats - List of existing threats in the project
 * @returns An object containing the new asset and its associated threats
 * 
 * @example
 * ```typescript
 * // User selects "Microprocessor"
 * const result = importEmb3dAssetWithThreats('PID-11', [], []);
 * 
 * console.log(result.asset.name); // "Microprocessor"
 * console.log(result.asset.source); // "emb3d"
 * console.log(result.threats.length); // 4
 * console.log(result.threats.map(t => `${t.emb3dThreatId}: ${t.name}`));
 * // [
 * //   "TID-101: Power Consumption Analysis Side Channel",
 * //   "TID-102: Electromagnetic Analysis Side Channel",
 * //   "TID-103: Microarchitectural Side Channels",
 * //   "TID-105: Hardware Fault Injection – Control Flow Modification"
 * // ]
 * ```
 */
export const importEmb3dAssetWithThreats = (
    devicePropertyId: string,
    existingAssets: Asset[],
    existingThreats: Threat[]
): { asset: Asset; threats: Threat[] } => {
    // Step 1: Get the Emb3d asset from the catalog
    const emb3dAssets = getEmb3dAssets();
    const emb3dAsset = emb3dAssets.find(a => a.id === devicePropertyId);

    if (!emb3dAsset) {
        throw new Error(`Device property ${devicePropertyId} not found in Emb3d catalog`);
    }

    // Step 2: Convert the Emb3d asset to a TARA asset
    const asset = convertEmb3dAssetToTaraAsset(
        emb3dAsset,
        existingAssets.map(a => a.id),
        existingAssets.length + 1
    );

    // Step 3: Convert all Emb3d threats to TARA threats
    const threats = convertEmb3dThreatsToTaraThreats(
        emb3dAsset,
        asset.id,
        existingThreats
    );

    return { asset, threats };
};
