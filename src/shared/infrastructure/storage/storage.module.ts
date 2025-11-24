import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';

/**
 * Storage Module
 *
 * Provides file storage services using MinIO/S3-compatible storage.
 */
@Module({
    providers: [MinioService],
    exports: [MinioService],
})
export class StorageModule { }

