import { describe, expect, it } from 'vitest';
import { SecurityProperty } from '../types';
import {
    convertTerraformResourcesToAssets,
    extractAssetsFromTerraform,
    getTerraformResourceStats,
    parseTerraformContent,
    TerraformResource,
} from './terraformService';

describe('terraformService', () => {
    describe('parseTerraformContent', () => {
        it('should parse a simple AWS EC2 instance resource', () => {
            const terraform = `
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  
  tags = {
    Name = "WebServer"
  }
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.resources).toHaveLength(1);
            expect(result.resources[0].type).toBe('aws_instance');
            expect(result.resources[0].name).toBe('web_server');
            expect(result.resources[0].attributes.ami).toBe('ami-0c55b159cbfafe1f0');
            expect(result.resources[0].attributes.instance_type).toBe('t2.micro');
        });

        it('should parse multiple resources', () => {
            const terraform = `
resource "aws_instance" "web" {
  ami = "ami-123"
  instance_type = "t2.micro"
}

resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
  acl    = "private"
}

resource "aws_db_instance" "database" {
  engine = "postgres"
  instance_class = "db.t3.micro"
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.resources).toHaveLength(3);
            expect(result.resources[0].type).toBe('aws_instance');
            expect(result.resources[1].type).toBe('aws_s3_bucket');
            expect(result.resources[2].type).toBe('aws_db_instance');
        });

        it('should parse resources with boolean attributes', () => {
            const terraform = `
resource "aws_db_instance" "db" {
  multi_az = true
  publicly_accessible = false
  encrypted = true
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.resources[0].attributes.multi_az).toBe(true);
            expect(result.resources[0].attributes.publicly_accessible).toBe(false);
            expect(result.resources[0].attributes.encrypted).toBe(true);
        });

        it('should parse resources with numeric attributes', () => {
            const terraform = `
resource "aws_db_instance" "db" {
  allocated_storage = 20
  backup_retention_period = 7
  port = 5432
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.resources[0].attributes.allocated_storage).toBe(20);
            expect(result.resources[0].attributes.backup_retention_period).toBe(7);
            expect(result.resources[0].attributes.port).toBe(5432);
        });

        it('should handle resources with comments', () => {
            const terraform = `
# This is a web server
resource "aws_instance" "web" {
  ami = "ami-123" # Ubuntu 20.04
  instance_type = "t2.micro"
}

/* Multi-line comment
   describing the database */
resource "aws_db_instance" "db" {
  engine = "postgres"
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.resources).toHaveLength(2);
            expect(result.resources[0].type).toBe('aws_instance');
            expect(result.resources[1].type).toBe('aws_db_instance');
        });

        it('should parse module blocks', () => {
            const terraform = `
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "3.0.0"
  
  name = "my-vpc"
  cidr = "10.0.0.0/16"
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.modules).toHaveLength(1);
            expect(result.modules[0].name).toBe('vpc');
            expect(result.modules[0].source).toBe('terraform-aws-modules/vpc/aws');
        });

        it('should handle empty Terraform content', () => {
            const result = parseTerraformContent('');

            expect(result.resources).toHaveLength(0);
            expect(result.modules).toHaveLength(0);
        });

        it('should handle Azure resources', () => {
            const terraform = `
resource "azurerm_virtual_machine" "vm" {
  name = "my-vm"
  location = "East US"
  vm_size = "Standard_DS1_v2"
}

resource "azurerm_storage_account" "storage" {
  name = "mystorageaccount"
  account_tier = "Standard"
  account_replication_type = "LRS"
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.resources).toHaveLength(2);
            expect(result.resources[0].type).toBe('azurerm_virtual_machine');
            expect(result.resources[1].type).toBe('azurerm_storage_account');
        });

        it('should handle Google Cloud resources', () => {
            const terraform = `
resource "google_compute_instance" "vm" {
  name = "my-instance"
  machine_type = "n1-standard-1"
  zone = "us-central1-a"
}

resource "google_storage_bucket" "bucket" {
  name = "my-bucket"
  location = "US"
}
            `;

            const result = parseTerraformContent(terraform);

            expect(result.resources).toHaveLength(2);
            expect(result.resources[0].type).toBe('google_compute_instance');
            expect(result.resources[1].type).toBe('google_storage_bucket');
        });
    });

    describe('convertTerraformResourcesToAssets', () => {
        it('should convert AWS compute resource to asset', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_instance',
                    name: 'web_server',
                    attributes: {
                        instance_type: 't2.micro',
                        ami: 'ami-123',
                    },
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets).toHaveLength(1);
            expect(assets[0].id).toBe('tf-aws_instance-web_server');
            expect(assets[0].name).toBe('web server');
            expect(assets[0].source).toBe('manual');
            expect(assets[0].comment).toContain('aws_instance');
            expect(assets[0].description).toContain('Compute');
            expect(assets[0].description).toContain('t2.micro');
        });

        it('should assign appropriate security properties to database resources', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_db_instance',
                    name: 'production_db',
                    attributes: {
                        engine: 'postgres',
                        multi_az: true,
                        encrypted: true,
                    },
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets[0].securityProperties).toContain(SecurityProperty.CONFIDENTIALITY);
            expect(assets[0].securityProperties).toContain(SecurityProperty.INTEGRITY);
            expect(assets[0].securityProperties).toContain(SecurityProperty.AVAILABILITY);
        });

        it('should assign security properties to storage resources', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_s3_bucket',
                    name: 'data_bucket',
                    attributes: {
                        versioning: true,
                    },
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets[0].securityProperties).toContain(SecurityProperty.CONFIDENTIALITY);
            expect(assets[0].securityProperties).toContain(SecurityProperty.INTEGRITY);
        });

        it('should assign security properties to security resources', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_kms_key',
                    name: 'encryption_key',
                    attributes: {
                        description: 'KMS key for encryption',
                    },
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets[0].securityProperties).toContain(SecurityProperty.CONFIDENTIALITY);
            expect(assets[0].securityProperties).toContain(SecurityProperty.INTEGRITY);
        });

        it('should filter out non-infrastructure resources', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_instance',
                    name: 'web',
                    attributes: {},
                },
                {
                    type: 'unknown_resource_type',
                    name: 'something',
                    attributes: {},
                },
                {
                    type: 'aws_s3_bucket',
                    name: 'bucket',
                    attributes: {},
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            // Should only include recognized resource types
            expect(assets).toHaveLength(2);
            expect(assets[0].id).toContain('aws_instance');
            expect(assets[1].id).toContain('aws_s3_bucket');
        });

        it('should apply TOE configuration IDs to assets', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_instance',
                    name: 'web',
                    attributes: {},
                },
            ];

            const toeConfigIds = ['toe-config-1', 'toe-config-2'];
            const assets = convertTerraformResourcesToAssets(resources, toeConfigIds);

            expect(assets[0].toeConfigurationIds).toEqual(toeConfigIds);
        });

        it('should handle Azure resources correctly', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'azurerm_linux_virtual_machine',
                    name: 'linux_vm',
                    attributes: {
                        size: 'Standard_B2s',
                    },
                },
                {
                    type: 'azurerm_postgresql_server',
                    name: 'pg_server',
                    attributes: {
                        sku_name: 'B_Gen5_1',
                    },
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets).toHaveLength(2);
            expect(assets[0].description).toContain('Compute');
            expect(assets[1].description).toContain('Database');
        });

        it('should handle Google Cloud resources correctly', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'google_compute_instance',
                    name: 'gcp_vm',
                    attributes: {
                        machine_type: 'n1-standard-1',
                    },
                },
                {
                    type: 'google_storage_bucket',
                    name: 'gcp_bucket',
                    attributes: {},
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets).toHaveLength(2);
            expect(assets[0].description).toContain('Compute');
            expect(assets[1].description).toContain('Storage');
        });

        it('should handle network resources', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_vpc',
                    name: 'main',
                    attributes: {},
                },
                {
                    type: 'aws_security_group',
                    name: 'web_sg',
                    attributes: {},
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets).toHaveLength(2);
            expect(assets[0].description).toContain('Network');
            expect(assets[1].description).toContain('Network');
        });

        it('should include encryption status in description', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_db_instance',
                    name: 'db',
                    attributes: {
                        encrypted: true,
                        multi_az: true,
                        publicly_accessible: true,
                    },
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets[0].description).toContain('Encryption enabled');
            expect(assets[0].description).toContain('Multi-AZ enabled');
            expect(assets[0].description).toContain('Publicly accessible');
        });

        it('should ensure at least one security property is assigned', () => {
            const resources: TerraformResource[] = [
                {
                    type: 'aws_vpc',
                    name: 'main',
                    attributes: {},
                },
            ];

            const assets = convertTerraformResourcesToAssets(resources);

            expect(assets[0].securityProperties.length).toBeGreaterThan(0);
        });
    });

    describe('extractAssetsFromTerraform', () => {
        it('should extract assets from Terraform content', async () => {
            const terraform = `
resource "aws_instance" "web" {
  ami = "ami-123"
  instance_type = "t2.micro"
}

resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
}
            `;

            const assets = await extractAssetsFromTerraform(terraform);

            expect(assets).toHaveLength(2);
            expect(assets[0].id).toContain('aws_instance');
            expect(assets[1].id).toContain('aws_s3_bucket');
        });

        it('should apply TOE configuration IDs', async () => {
            const terraform = `
resource "aws_instance" "web" {
  ami = "ami-123"
}
            `;

            const toeConfigIds = ['config-1'];
            const assets = await extractAssetsFromTerraform(terraform, toeConfigIds);

            expect(assets[0].toeConfigurationIds).toEqual(toeConfigIds);
        });

        it('should handle empty content', async () => {
            const assets = await extractAssetsFromTerraform('');
            expect(assets).toHaveLength(0);
        });

        it('should extract multiple resource types', async () => {
            const terraform = `
resource "aws_instance" "web" {
  instance_type = "t2.micro"
}

resource "aws_db_instance" "db" {
  engine = "postgres"
}

resource "aws_s3_bucket" "bucket" {
  bucket = "data"
}

resource "aws_kms_key" "key" {
  description = "Encryption key"
}
            `;

            const assets = await extractAssetsFromTerraform(terraform);

            expect(assets).toHaveLength(4);

            const categories = assets.map(a => {
                if (a.description.includes('Compute')) return 'Compute';
                if (a.description.includes('Database')) return 'Database';
                if (a.description.includes('Storage')) return 'Storage';
                if (a.description.includes('Security')) return 'Security';
                return 'Other';
            });

            expect(categories).toContain('Compute');
            expect(categories).toContain('Database');
            expect(categories).toContain('Storage');
            expect(categories).toContain('Security');
        });
    });

    describe('getTerraformResourceStats', () => {
        it('should calculate statistics for resources', () => {
            const resources: TerraformResource[] = [
                { type: 'aws_instance', name: 'web1', attributes: {} },
                { type: 'aws_instance', name: 'web2', attributes: {} },
                { type: 'aws_s3_bucket', name: 'bucket', attributes: {} },
                { type: 'aws_db_instance', name: 'db', attributes: {} },
                { type: 'aws_vpc', name: 'vpc', attributes: {} },
            ];

            const stats = getTerraformResourceStats(resources);

            expect(stats.totalResources).toBe(5);
            expect(stats.byCategory.Compute).toBe(2);
            expect(stats.byCategory.Storage).toBe(1);
            expect(stats.byCategory.Database).toBe(1);
            expect(stats.byCategory.Network).toBe(1);
            expect(stats.byType['aws_instance']).toBe(2);
        });

        it('should handle empty resources array', () => {
            const stats = getTerraformResourceStats([]);

            expect(stats.totalResources).toBe(0);
            expect(Object.keys(stats.byCategory)).toHaveLength(0);
            expect(Object.keys(stats.byType)).toHaveLength(0);
        });

        it('should categorize unknown resource types as Other', () => {
            const resources: TerraformResource[] = [
                { type: 'aws_instance', name: 'web', attributes: {} },
                { type: 'unknown_type', name: 'unknown', attributes: {} },
            ];

            const stats = getTerraformResourceStats(resources);

            expect(stats.byCategory.Compute).toBe(1);
            expect(stats.byCategory.Other).toBe(1);
        });
    });

    describe('Integration tests', () => {
        it('should handle a complete AWS infrastructure example', async () => {
            const terraform = `
# VPC and Network
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id
}

# Compute
resource "aws_instance" "web" {
  ami = "ami-123"
  instance_type = "t2.micro"
}

# Database
resource "aws_db_instance" "postgres" {
  engine = "postgres"
  instance_class = "db.t3.micro"
  multi_az = true
  encrypted = true
}

# Storage
resource "aws_s3_bucket" "assets" {
  bucket = "my-assets"
}

# Security
resource "aws_kms_key" "encryption" {
  description = "Encryption key"
}
            `;

            const assets = await extractAssetsFromTerraform(terraform);
            const resources = parseTerraformContent(terraform).resources;
            const stats = getTerraformResourceStats(resources);

            expect(assets.length).toBeGreaterThan(0);
            expect(stats.totalResources).toBe(7);
            expect(stats.byCategory.Network).toBe(3);
            expect(stats.byCategory.Compute).toBe(1);
            expect(stats.byCategory.Database).toBe(1);
            expect(stats.byCategory.Storage).toBe(1);
            expect(stats.byCategory.Security).toBe(1);
        });

        it('should handle Azure infrastructure example', async () => {
            const terraform = `
resource "azurerm_virtual_network" "main" {
  name = "my-vnet"
  address_space = ["10.0.0.0/16"]
}

resource "azurerm_linux_virtual_machine" "vm" {
  name = "my-vm"
  size = "Standard_B2s"
}

resource "azurerm_postgresql_server" "db" {
  name = "my-postgres"
  sku_name = "B_Gen5_1"
}

resource "azurerm_storage_account" "storage" {
  name = "mystorageaccount"
  account_tier = "Standard"
}

resource "azurerm_key_vault" "vault" {
  name = "my-keyvault"
  sku_name = "standard"
}
            `;

            const assets = await extractAssetsFromTerraform(terraform);

            expect(assets).toHaveLength(5);

            const hasNetwork = assets.some(a => a.description.includes('Network'));
            const hasCompute = assets.some(a => a.description.includes('Compute'));
            const hasDatabase = assets.some(a => a.description.includes('Database'));
            const hasStorage = assets.some(a => a.description.includes('Storage'));
            const hasSecurity = assets.some(a => a.description.includes('Security'));

            expect(hasNetwork).toBe(true);
            expect(hasCompute).toBe(true);
            expect(hasDatabase).toBe(true);
            expect(hasStorage).toBe(true);
            expect(hasSecurity).toBe(true);
        });
    });
});
