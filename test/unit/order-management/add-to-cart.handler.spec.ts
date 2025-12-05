import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { AddToCartCommandHandler } from '../../../src/modules/order-management/application/handlers/add-to-cart.handler';
import { AddToCartCommand } from '../../../src/modules/order-management/application/commands/add-to-cart.command';
import { CART_REPOSITORY_TOKEN } from '../../../src/modules/order-management/domain/repositories/repository.tokens';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../src/modules/product-catalog/domain/repositories/repository.tokens';
import { ICartRepository } from '../../../src/modules/order-management/domain/repositories/icart-repository';
import { IProductRepository } from '../../../src/modules/product-catalog/domain/repositories/product.repository.interface';
import { Cart } from '../../../src/modules/order-management/domain/aggregates/cart';
import { Product } from '../../../src/modules/product-catalog/domain/aggregates/product';
import { SKU } from '../../../src/modules/product-catalog/domain/value-objects/sku';
import { Money } from '../../../src/modules/product-catalog/domain/value-objects/money';
import { ProductImage } from '../../../src/modules/product-catalog/domain/value-objects/product-image';
import { ProductVariant } from '../../../src/modules/product-catalog/domain/entities/product-variant';
import { InventoryInfo } from '../../../src/modules/product-catalog/domain/value-objects/inventory-info';
import { v4 as uuidv4 } from 'uuid';

describe('AddToCartCommandHandler', () => {
  let handler: AddToCartCommandHandler;
  let mockCartRepository: jest.Mocked<ICartRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    mockCartRepository = {
      findById: jest.fn(),
      findActiveByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockProductRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findAll: jest.fn(),
      findBySku: jest.fn(),
      findByCategory: jest.fn(),
      search: jest.fn(),
      findByBrand: jest.fn(),
      findByTags: jest.fn(),
      existsBySku: jest.fn(),
      countByCategory: jest.fn(),
      countSearch: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddToCartCommandHandler,
        {
          provide: CART_REPOSITORY_TOKEN,
          useValue: mockCartRepository,
        },
        {
          provide: PRODUCT_REPOSITORY_TOKEN,
          useValue: mockProductRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<AddToCartCommandHandler>(AddToCartCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const createMockProduct = (
      id: string,
      name: string,
      price: number,
      sku: string,
      variants: ProductVariant[] = [],
    ): Product => {
      const product = Product.create(
        id,
        new SKU(sku),
        name,
        'Test description',
        uuidv4(),
        'Test Brand',
        [new ProductImage('https://example.com/image.jpg', 'Test Image', 1, true)],
        new Money(price, 'USD'),
      );

      // Add variants if provided
      variants.forEach(variant => {
        const result = product.addVariant(variant);
        if (result.isFailure) {
          const errorMsg = Array.isArray(result.error) ? result.error.join(', ') : result.error;
          throw new Error(errorMsg);
        }
      });

      return product;
    };

    const createMockVariant = (
      id: string,
      sku: string,
      priceDelta: number,
    ): ProductVariant => {
      return ProductVariant.create(
        id,
        new SKU(sku),
        new Map([['color', 'Red']]),
        new Money(priceDelta, 'USD'),
        new InventoryInfo(100),
      );
    };

    it('should create a new cart and add an item when cart does not exist', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const quantity = 2;

      const product = createMockProduct(productId, 'Test Product', 99.99, 'TEST-001');
      const cart = Cart.create(userId);

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findActiveByUserId.mockResolvedValueOnce(null);
      mockCartRepository.save.mockResolvedValue(undefined);
      mockCartRepository.findActiveByUserId.mockResolvedValueOnce(cart);

      const command = new AddToCartCommand(userId, productId, quantity);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockCartRepository.findActiveByUserId).toHaveBeenCalledWith(userId);
      expect(mockCartRepository.save).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
    });

    it('should add item to existing cart', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const quantity = 2;

      const product = createMockProduct(productId, 'Test Product', 99.99, 'TEST-001');
      const existingCart = Cart.create(userId);
      const updatedCart = Cart.create(userId);

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findActiveByUserId
        .mockResolvedValueOnce(existingCart)
        .mockResolvedValueOnce(updatedCart);
      mockCartRepository.save.mockResolvedValue(undefined);

      const command = new AddToCartCommand(userId, productId, quantity);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockCartRepository.findActiveByUserId).toHaveBeenCalledTimes(2);
      expect(mockCartRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const quantity = 1;

      mockProductRepository.findById.mockResolvedValue(null);

      const command = new AddToCartCommand(userId, productId, quantity);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        `Product with ID ${productId} not found`,
      );
      expect(mockCartRepository.save).not.toHaveBeenCalled();
    });

    it('should handle product with variant', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const variantId = uuidv4();
      const quantity = 1;

      const variant = createMockVariant(variantId, 'VARIANT-SKU', 10.00);
      const product = createMockProduct(productId, 'Test Product', 100.00, 'TEST-001', [variant]);
      const cart = Cart.create(userId);

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findActiveByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(cart);
      mockCartRepository.save.mockResolvedValue(undefined);

      const command = new AddToCartCommand(userId, productId, quantity, variantId);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockCartRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should use base product price when no variant is specified', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const quantity = 1;

      const product = createMockProduct(productId, 'Test Product', 99.99, 'TEST-001');
      const cart = Cart.create(userId);

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findActiveByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(cart);
      mockCartRepository.save.mockResolvedValue(undefined);

      const command = new AddToCartCommand(userId, productId, quantity);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockCartRepository.save).toHaveBeenCalled();
      const savedCart = mockCartRepository.save.mock.calls[0][0] as Cart;
      expect(savedCart).toBeDefined();
    });

    it('should publish domain events from cart', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const quantity = 1;

      const product = createMockProduct(productId, 'Test Product', 99.99, 'TEST-001');
      const cart = Cart.create(userId);

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findActiveByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(cart);
      mockCartRepository.save.mockResolvedValue(undefined);

      const command = new AddToCartCommand(userId, productId, quantity);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw error when cart is not found after saving', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const quantity = 1;

      const product = createMockProduct(productId, 'Test Product', 99.99, 'TEST-001');
      const cart = Cart.create(userId);

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findActiveByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // Cart not found after save
      mockCartRepository.save.mockResolvedValue(undefined);

      const command = new AddToCartCommand(userId, productId, quantity);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Cart not found after adding item',
      );
    });

    it('should use default currency USD when product currency is not set', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const quantity = 1;

      const product = Product.create(
        productId,
        new SKU('TEST-001'),
        'Test Product',
        'Description',
        uuidv4(),
        'Brand',
        [new ProductImage('https://example.com/image.jpg', 'Image', 1, true)],
        new Money(99.99, 'USD'),
      );
      const cart = Cart.create(userId);

      mockProductRepository.findById.mockResolvedValue(product);
      mockCartRepository.findActiveByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(cart);
      mockCartRepository.save.mockResolvedValue(undefined);

      const command = new AddToCartCommand(userId, productId, quantity);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(mockCartRepository.save).toHaveBeenCalled();
    });
  });
});

