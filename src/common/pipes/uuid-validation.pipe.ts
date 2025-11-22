import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';

/**
 * UuidValidationPipe
 *
 * Validates that a string parameter is a valid UUID.
 * Used for path parameters that should be UUIDs.
 *
 * Usage:
 * @Param('id', UuidValidationPipe) id: string
 */
@Injectable()
export class UuidValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!uuidValidate(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }
    return value;
  }
}
