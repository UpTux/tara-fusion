import { Asset, SecurityProperty } from '../types';

/**
 * MITRE Emb3d Asset Properties
 * Based on the emb3d_properties_list.xlsx file
 */
export interface Emb3dAsset {
    name: string;
    description: string;
    category?: string;
    properties: {
        confidentiality?: boolean;
        integrity?: boolean;
        availability?: boolean;
    };
}

/**
 * Parse the MITRE Emb3d properties from the embedded data
 * This is a simplified version - in a real implementation, you would parse the Excel file
 */
export const getEmb3dAssets = (): Emb3dAsset[] => {
    // This data would normally be parsed from the Excel file
    // For now, we'll provide a comprehensive list of common embedded system assets
    // based on MITRE Emb3d framework
    return [
        {
            name: 'Microcontroller',
            description: 'Central processing unit for embedded systems',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Memory (RAM)',
            description: 'Random Access Memory for temporary data storage',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Flash Memory',
            description: 'Non-volatile storage for firmware and data',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Communication Interface (UART)',
            description: 'Serial communication interface',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Communication Interface (SPI)',
            description: 'Serial Peripheral Interface',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Communication Interface (I2C)',
            description: 'Inter-Integrated Circuit communication',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Network Interface (Ethernet)',
            description: 'Wired network communication interface',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Network Interface (Wi-Fi)',
            description: 'Wireless network communication interface',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Network Interface (Bluetooth)',
            description: 'Short-range wireless communication',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Sensor Interface',
            description: 'Interface for connecting sensors',
            category: 'Hardware',
            properties: { confidentiality: false, integrity: true, availability: true }
        },
        {
            name: 'Actuator Interface',
            description: 'Interface for controlling actuators',
            category: 'Hardware',
            properties: { confidentiality: false, integrity: true, availability: true }
        },
        {
            name: 'Power Supply',
            description: 'Power management and distribution',
            category: 'Hardware',
            properties: { confidentiality: false, integrity: false, availability: true }
        },
        {
            name: 'Cryptographic Module',
            description: 'Hardware security module for encryption',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Debug Interface (JTAG)',
            description: 'Joint Test Action Group debugging interface',
            category: 'Hardware',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Bootloader',
            description: 'Initial program loader for the system',
            category: 'Software',
            properties: { confidentiality: false, integrity: true, availability: true }
        },
        {
            name: 'Operating System',
            description: 'Real-time or embedded operating system',
            category: 'Software',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Application Firmware',
            description: 'Main application software',
            category: 'Software',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Configuration Data',
            description: 'System configuration and settings',
            category: 'Data',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Cryptographic Keys',
            description: 'Encryption and authentication keys',
            category: 'Data',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Sensor Data',
            description: 'Data collected from sensors',
            category: 'Data',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Log Data',
            description: 'System and application logs',
            category: 'Data',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'User Data',
            description: 'User-specific information and credentials',
            category: 'Data',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Network Protocol Stack',
            description: 'TCP/IP or other network protocol implementation',
            category: 'Software',
            properties: { confidentiality: true, integrity: true, availability: true }
        },
        {
            name: 'Device Drivers',
            description: 'Software for hardware component control',
            category: 'Software',
            properties: { confidentiality: false, integrity: true, availability: true }
        },
        {
            name: 'Update Mechanism',
            description: 'Firmware update and patch system',
            category: 'Software',
            properties: { confidentiality: false, integrity: true, availability: true }
        }
    ];
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
        comment: emb3dAsset.category ? `Category: ${emb3dAsset.category}\n\nImported from MITRE Emb3d` : 'Imported from MITRE Emb3d'
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
