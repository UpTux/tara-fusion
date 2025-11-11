import { Asset, SecurityProperty } from '../types';

/**
 * Terraform Resource parsed from a .tf file
 */
export interface TerraformResource {
    type: string;
    name: string;
    attributes: Record<string, any>;
    dependencies?: string[];
}

/**
 * Terraform Module parsed from a .tf file
 */
export interface TerraformModule {
    name: string;
    source: string;
    attributes: Record<string, any>;
}

/**
 * Result of parsing a Terraform file
 */
export interface TerraformParseResult {
    resources: TerraformResource[];
    modules: TerraformModule[];
    variables: Record<string, any>;
    outputs: Record<string, any>;
}

/**
 * Map Terraform resource types to security-relevant categories
 */
const RESOURCE_TYPE_CATEGORIES: Record<string, string> = {
    // Compute resources
    'aws_instance': 'Compute',
    'aws_ecs_service': 'Compute',
    'aws_ecs_task_definition': 'Compute',
    'aws_lambda_function': 'Compute',
    'azurerm_virtual_machine': 'Compute',
    'azurerm_linux_virtual_machine': 'Compute',
    'azurerm_windows_virtual_machine': 'Compute',
    'google_compute_instance': 'Compute',

    // Database resources
    'aws_db_instance': 'Database',
    'aws_rds_cluster': 'Database',
    'aws_dynamodb_table': 'Database',
    'azurerm_sql_database': 'Database',
    'azurerm_postgresql_server': 'Database',
    'azurerm_mysql_server': 'Database',
    'azurerm_cosmosdb_account': 'Database',
    'google_sql_database_instance': 'Database',

    // Storage resources
    'aws_s3_bucket': 'Storage',
    'aws_ebs_volume': 'Storage',
    'azurerm_storage_account': 'Storage',
    'azurerm_storage_container': 'Storage',
    'google_storage_bucket': 'Storage',

    // Network resources
    'aws_vpc': 'Network',
    'aws_subnet': 'Network',
    'aws_security_group': 'Network',
    'aws_lb': 'Network',
    'aws_alb': 'Network',
    'aws_api_gateway_rest_api': 'Network',
    'azurerm_virtual_network': 'Network',
    'azurerm_subnet': 'Network',
    'azurerm_network_security_group': 'Network',
    'azurerm_lb': 'Network',
    'google_compute_network': 'Network',
    'google_compute_subnetwork': 'Network',
    'google_compute_firewall': 'Network',

    // Security resources
    'aws_kms_key': 'Security',
    'aws_secretsmanager_secret': 'Security',
    'aws_iam_role': 'Security',
    'aws_iam_policy': 'Security',
    'azurerm_key_vault': 'Security',
    'azurerm_key_vault_secret': 'Security',
    'google_kms_crypto_key': 'Security',
    'google_secret_manager_secret': 'Security',

    // Container resources
    'aws_ecs_cluster': 'Container',
    'aws_ecr_repository': 'Container',
    'azurerm_kubernetes_cluster': 'Container',
    'azurerm_container_registry': 'Container',
    'google_container_cluster': 'Container',
    'google_container_registry': 'Container',
};

/**
 * Determine security properties based on resource type and attributes
 */
const determineSecurityProperties = (
    resourceType: string,
    attributes: Record<string, any>
): SecurityProperty[] => {
    const properties: SecurityProperty[] = [];
    const category = RESOURCE_TYPE_CATEGORIES[resourceType] || 'Other';

    // Confidentiality - relevant for storage, database, secrets
    if (
        category === 'Database' ||
        category === 'Storage' ||
        category === 'Security' ||
        resourceType.includes('secret') ||
        resourceType.includes('kms') ||
        resourceType.includes('key_vault') ||
        attributes.encryption !== false
    ) {
        properties.push(SecurityProperty.CONFIDENTIALITY);
    }

    // Integrity - relevant for databases, compute, security resources
    if (
        category === 'Database' ||
        category === 'Compute' ||
        category === 'Security' ||
        resourceType.includes('iam') ||
        attributes.versioning === true ||
        attributes.backup_retention_period !== undefined
    ) {
        properties.push(SecurityProperty.INTEGRITY);
    }

    // Availability - relevant for most infrastructure resources
    if (
        category === 'Compute' ||
        category === 'Database' ||
        category === 'Network' ||
        category === 'Container' ||
        attributes.multi_az === true ||
        attributes.backup_enabled === true ||
        attributes.high_availability !== false
    ) {
        properties.push(SecurityProperty.AVAILABILITY);
    }

    // Ensure at least one security property is assigned
    if (properties.length === 0) {
        properties.push(SecurityProperty.INTEGRITY);
    }

    // Remove duplicates
    return [...new Set(properties)];
};

/**
 * Generate a readable description from Terraform resource type and attributes
 */
const generateDescription = (
    resourceType: string,
    name: string,
    attributes: Record<string, any>
): string => {
    const category = RESOURCE_TYPE_CATEGORIES[resourceType] || 'Infrastructure';
    const parts: string[] = [];

    parts.push(`${category} resource of type ${resourceType}`);

    // Add key configuration details
    if (attributes.instance_type) {
        parts.push(`Instance type: ${attributes.instance_type}`);
    }
    if (attributes.engine) {
        parts.push(`Engine: ${attributes.engine}`);
    }
    if (attributes.engine_version) {
        parts.push(`Version: ${attributes.engine_version}`);
    }
    if (attributes.storage_type) {
        parts.push(`Storage: ${attributes.storage_type}`);
    }
    if (attributes.multi_az === true) {
        parts.push('Multi-AZ enabled');
    }
    if (attributes.publicly_accessible === true) {
        parts.push('Publicly accessible');
    }
    if (attributes.encrypted === true || attributes.encryption !== false) {
        parts.push('Encryption enabled');
    }

    return parts.join('. ');
};

/**
 * Simple Terraform HCL parser
 * Note: This is a basic parser for common Terraform patterns.
 * For production use, consider using a proper HCL parser library.
 */
export const parseTerraformContent = (content: string): TerraformParseResult => {
    const result: TerraformParseResult = {
        resources: [],
        modules: [],
        variables: {},
        outputs: {},
    };

    // Remove comments
    const lines = content.split('\n').map(line => {
        const commentIndex = line.indexOf('#');
        return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
    });

    const cleanContent = lines.join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*/g, ''); // Remove line comments

    // Parse resource blocks: resource "type" "name" { ... }
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    let match;

    while ((match = resourceRegex.exec(cleanContent)) !== null) {
        const [, type, name, body] = match;
        const attributes = parseAttributes(body);

        result.resources.push({
            type,
            name,
            attributes,
        });
    }

    // Parse module blocks: module "name" { ... }
    const moduleRegex = /module\s+"([^"]+)"\s*\{([^}]*)\}/g;

    while ((match = moduleRegex.exec(cleanContent)) !== null) {
        const [, name, body] = match;
        const attributes = parseAttributes(body);

        result.modules.push({
            name,
            source: attributes.source || '',
            attributes,
        });
    }

    return result;
};

/**
 * Parse attributes from a Terraform block body
 */
const parseAttributes = (body: string): Record<string, any> => {
    const attributes: Record<string, any> = {};

    // Simple key-value parsing (key = value)
    const attrRegex = /(\w+)\s*=\s*([^"\n][^\n]*|"[^"]*")/g;
    let match;

    while ((match = attrRegex.exec(body)) !== null) {
        const [, key, value] = match;

        // Parse value
        let parsedValue: any = value.trim();

        // Remove quotes from strings
        if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
            parsedValue = parsedValue.slice(1, -1);
        }
        // Parse booleans
        else if (parsedValue === 'true') {
            parsedValue = true;
        } else if (parsedValue === 'false') {
            parsedValue = false;
        }
        // Parse numbers
        else if (/^\d+$/.test(parsedValue)) {
            parsedValue = parseInt(parsedValue, 10);
        }

        attributes[key] = parsedValue;
    }

    return attributes;
};

/**
 * Convert Terraform resources to Assets
 */
export const convertTerraformResourcesToAssets = (
    resources: TerraformResource[],
    toeConfigurationIds: string[] = []
): Asset[] => {
    return resources
        .filter(resource => {
            // Filter out non-infrastructure resources (e.g., data sources, locals)
            return RESOURCE_TYPE_CATEGORIES[resource.type] !== undefined;
        })
        .map(resource => {
            const securityProperties = determineSecurityProperties(
                resource.type,
                resource.attributes
            );

            const description = generateDescription(
                resource.type,
                resource.name,
                resource.attributes
            );

            return {
                id: `tf-${resource.type}-${resource.name}`,
                name: resource.name.replace(/_/g, ' '),
                securityProperties,
                description,
                toeConfigurationIds,
                comment: `Imported from Terraform: ${resource.type}`,
                source: 'manual' as const,
            };
        });
};

/**
 * Parse a Terraform file and extract assets
 */
export const extractAssetsFromTerraform = async (
    fileContent: string,
    toeConfigurationIds: string[] = []
): Promise<Asset[]> => {
    try {
        const parseResult = parseTerraformContent(fileContent);
        return convertTerraformResourcesToAssets(parseResult.resources, toeConfigurationIds);
    } catch (error) {
        console.error('Error parsing Terraform file:', error);
        throw new Error(`Failed to parse Terraform file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Read and parse a Terraform file from a File object
 */
export const extractAssetsFromTerraformFile = async (
    file: File,
    toeConfigurationIds: string[] = []
): Promise<Asset[]> => {
    const content = await file.text();
    return extractAssetsFromTerraform(content, toeConfigurationIds);
};

/**
 * Get statistics about parsed Terraform resources
 */
export const getTerraformResourceStats = (resources: TerraformResource[]): {
    totalResources: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
} => {
    const stats = {
        totalResources: resources.length,
        byCategory: {} as Record<string, number>,
        byType: {} as Record<string, number>,
    };

    resources.forEach(resource => {
        const category = RESOURCE_TYPE_CATEGORIES[resource.type] || 'Other';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;
    });

    return stats;
};
