/* eslint-disable @typescript-eslint/ban-types */
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Custom Validation Pipe
 *
 * Validates incoming DTOs using class-validator decorators
 * Provides detailed error messages
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.buildError(errors));
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private buildError(errors: ValidationError[]) {
    const result: Record<string, any> = {}; // ✅ explicit indexable type

    errors.forEach((error) => {
      const property = error.property;
      const constraints = error.constraints;
      const result: Record<string, any> = {};

      if (constraints) {
        result[property] = Object.values(constraints);
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        result[property] = this.buildError(error.children);
      }
    });

    return {
      message: 'Validation failed',
      errors: result,
    };
  }
}
