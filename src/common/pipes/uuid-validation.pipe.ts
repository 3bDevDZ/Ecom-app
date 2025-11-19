import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';

/**
 * UUID Validation Pipe
 * 
 * Validates that a parameter is a valid UUID
 * Usage: @Param('id', UuidValidationPipe) id: string
 */
@Injectable()
export class UuidValidationPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUUID(value)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data} must be a valid UUID`,
      );
    }
    return value;
  }
}

