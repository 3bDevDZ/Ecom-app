import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * MinIO Service
 *
 * Handles file storage operations using MinIO/S3-compatible object storage.
 * Used for storing receipts, documents, and other assets.
 */
@Injectable()
export class MinioService implements OnModuleInit {
    private readonly logger = new Logger(MinioService.name);
    private minioClient: Minio.Client;
    private readonly bucketName: string;

    constructor(private readonly configService: ConfigService) {
        const storageConfig = this.configService.get('app.storage') || {};

        this.minioClient = new Minio.Client({
            endPoint: storageConfig.endpoint || 'localhost',
            port: storageConfig.port || 9000,
            useSSL: storageConfig.useSSL || false,
            accessKey: storageConfig.accessKey || 'minioadmin',
            secretKey: storageConfig.secretKey || 'minioadmin',
        });

        // Use receipts bucket for receipts, ecommerce-assets for other files
        this.bucketName = storageConfig.bucket || 'ecommerce-assets';
    }

    /**
     * Get receipts bucket name
     */
    getReceiptsBucket(): string {
        return 'receipts';
    }

    async onModuleInit() {
        // Ensure default bucket exists
        await this.ensureBucketExists(this.bucketName);
        // Ensure receipts bucket exists
        await this.ensureBucketExists('receipts');
    }

    /**
     * Ensure the bucket exists, create if it doesn't
     */
    private async ensureBucketExists(bucketName: string): Promise<void> {
        try {
            const exists = await this.minioClient.bucketExists(bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(bucketName);
                this.logger.log(`Bucket "${bucketName}" created successfully`);
            } else {
                this.logger.log(`Bucket "${bucketName}" already exists`);
            }
        } catch (error) {
            this.logger.error(`Failed to ensure bucket exists: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Upload a file to MinIO
     *
     * @param filePath - Object path in the bucket
     * @param fileBuffer - File content as Buffer
     * @param contentType - MIME type of the file
     * @returns Promise with the object URL
     */
    async uploadFile(
        filePath: string,
        fileBuffer: Buffer,
        contentType: string = 'application/octet-stream',
    ): Promise<string> {
        try {
            await this.minioClient.putObject(
                this.bucketName,
                filePath,
                fileBuffer,
                fileBuffer.length,
                {
                    'Content-Type': contentType,
                },
            );

            // Generate URL (presigned URL for private buckets, or public URL)
            const url = await this.getFileUrl(filePath);
            this.logger.log(`File uploaded successfully: ${filePath}`);

            return url;
        } catch (error) {
            this.logger.error(`Failed to upload file ${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Upload file to a specific bucket
     */
    async uploadFileToBucket(
        bucketName: string,
        filePath: string,
        fileBuffer: Buffer,
        contentType: string = 'application/octet-stream',
    ): Promise<string> {
        try {
            // Ensure bucket exists
            await this.ensureBucketExists(bucketName);

            await this.minioClient.putObject(
                bucketName,
                filePath,
                fileBuffer,
                fileBuffer.length,
                {
                    'Content-Type': contentType,
                },
            );

            // Generate presigned URL
            const url = await this.minioClient.presignedGetObject(bucketName, filePath, 604800);
            this.logger.log(`File uploaded successfully to bucket "${bucketName}": ${filePath}`);

            return url;
        } catch (error) {
            this.logger.error(`Failed to upload file to bucket ${bucketName}/${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get file URL from a specific bucket
     */
    async getFileUrlFromBucket(
        bucketName: string,
        filePath: string,
        expirySeconds: number = 604800,
    ): Promise<string> {
        try {
            const url = await this.minioClient.presignedGetObject(bucketName, filePath, expirySeconds);
            return url;
        } catch (error) {
            this.logger.error(`Failed to generate file URL for ${bucketName}/${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Download file from a specific bucket
     */
    async downloadFileFromBucket(bucketName: string, filePath: string): Promise<Buffer> {
        try {
            const chunks: Buffer[] = [];
            const stream = await this.minioClient.getObject(bucketName, filePath);

            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        } catch (error) {
            this.logger.error(`Failed to download file from ${bucketName}/${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Check if file exists in a specific bucket
     */
    async fileExistsInBucket(bucketName: string, filePath: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(bucketName, filePath);
            return true;
        } catch (error: any) {
            if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get file URL (presigned URL for private access)
     *
     * @param filePath - Object path in the bucket
     * @param expirySeconds - URL expiration time in seconds (default: 7 days)
     * @returns Promise with presigned URL
     */
    async getFileUrl(filePath: string, expirySeconds: number = 604800): Promise<string> {
        try {
            const url = await this.minioClient.presignedGetObject(this.bucketName, filePath, expirySeconds);
            return url;
        } catch (error) {
            this.logger.error(`Failed to generate file URL for ${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Download a file from MinIO
     *
     * @param filePath - Object path in the bucket
     * @returns Promise with file Buffer
     */
    async downloadFile(filePath: string): Promise<Buffer> {
        try {
            const chunks: Buffer[] = [];
            const stream = await this.minioClient.getObject(this.bucketName, filePath);

            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        } catch (error) {
            this.logger.error(`Failed to download file ${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Delete a file from MinIO
     *
     * @param filePath - Object path in the bucket
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            await this.minioClient.removeObject(this.bucketName, filePath);
            this.logger.log(`File deleted successfully: ${filePath}`);
        } catch (error) {
            this.logger.error(`Failed to delete file ${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Check if a file exists
     *
     * @param filePath - Object path in the bucket
     * @returns Promise with boolean indicating file existence
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucketName, filePath);
            return true;
        } catch (error: any) {
            if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
                return false;
            }
            throw error;
        }
    }
}

