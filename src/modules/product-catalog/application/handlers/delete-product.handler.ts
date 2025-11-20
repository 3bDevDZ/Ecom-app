import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DeleteProductCommand } from '../commands/delete-product.command';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Inject } from '@nestjs/common';

/**
 * DeleteProductCommandHandler
 *
 * Handles the DeleteProductCommand to delete a product.
 */
@CommandHandler(DeleteProductCommand)
@Injectable()
export class DeleteProductCommandHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    // Check if product exists
    const exists = await this.productRepository.exists(command.id);
    if (!exists) {
      throw new NotFoundException(`Product with ID ${command.id} not found`);
    }

    // Delete product
    await this.productRepository.delete(command.id);
  }
}

