import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AddToCartCommand } from '../../../src/modules/order-management/application/commands/add-to-cart.command';
import { AddToCartCommandHandler } from '../../../src/modules/order-management/application/handlers/add-to-cart.handler';
import { CartItemEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart-item.entity';
import { CartEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart.entity';
import { CartRepository } from '../../../src/modules/order-management/infrastructure/persistence/repositories/cart.repository';
import { CART_REPOSITORY_TOKEN } from '../../../src/modules/order-management/domain/repositories/repository.tokens';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../src/modules/product-catalog/domain/repositories/repository.tokens';
import { ProductRepository } from '../../../src/modules/product-catalog/infrastructure/persistence/repositories/product.repository';
import { ProductEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/product.entity';
import { ProductVariantEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/product-variant.entity';
import { CategoryEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/category.entity';
import { Product } from '../../../src/modules/product-catalog/domain/aggregates/product';
import { SKU } from '../../../src/modules/product-catalog/domain/value-objects/sku';
import { Money } from '../../../src/modules/product-catalog/domain/value-objects/money';
import { ProductImage } from '../../../src/modules/product-catalog/domain/value-objects/product-image';
import { ProductVariant } from '../../../src/modules/product-catalog/domain/entities/product-variant';
import { InventoryInfo } from '../../../src/modules/product-catalog/domain/value-objects/inventory-info';
import { EventBusService } from '../../../src/shared/event/event-bus.service';
import { OutboxEntity } from '../../../src/shared/infrastructure/outbox/outbox.entity';
import { OutboxService } from '../../../src/shared/infrastructure/outbox/outbox.service';
import { UnitOfWorkContextService } from '../../../src/shared/infrastructure/uow/uow-context.service';
import { TestDatabaseHelper } from '../../helpers/database.helper';

describe('AddToCartCommandHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: AddToCartCommandHandler;
  let cartRepository: CartRepository;
  let productRepository: ProductRepository;
  let cartEntityRepository: Repository<CartEntity>;
  let cartItemEntityRepository: Repository<CartItemEntity>;
  let productEntityRepository: Repository<ProductEntity>;
  let categoryEntityRepository: Repository<CategoryEntity>;
  let eventBus: EventBus;
  let testCategoryId: string;

  // Helper to create and save a real product in the database
  const createAndSaveProduct = async (
    name: string,
    price: number,
    sku: string,
    variants: ProductVariant[] = [],
  ): Promise<Product> => {
    const product = Product.create(
      uuidv4(),
      new SKU(sku),
      name,
      'Test product description',
      testCategoryId,
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

    // Save product to database
    return await productRepository.save(product);
  };

  // Helper to create a variant
  const createVariant = (
    sku: string,
    priceDelta: number,
  ): ProductVariant => {
    return ProductVariant.create(
      uuidv4(),
      new SKU(sku),
      new Map([['color', 'Red']]),
      new Money(priceDelta, 'USD'),
      new InventoryInfo(100),
    );
  };

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([
      CartEntity,
      CartItemEntity,
      ProductEntity,
      ProductVariantEntity,
      CategoryEntity,
    ]);

    // Create a test category first
    const categoryEntity = new CategoryEntity();
    categoryEntity.id = uuidv4();
    categoryEntity.name = 'Test Category';
    categoryEntity.slug = 'test-category';
    categoryEntity.description = 'Test category for integration tests';
    categoryEntity.isActive = true;
    categoryEntity.createdAt = new Date();
    categoryEntity.updatedAt = new Date();
    testCategoryId = categoryEntity.id;

    const module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || process.env.DATABASE_PORT || '5432', 10),
          username: process.env.TEST_DB_USERNAME || process.env.DATABASE_USER || 'ecommerce',
          password: process.env.TEST_DB_PASSWORD || process.env.DATABASE_PASSWORD || 'ecommerce_password',
          database: dataSource.options.database as string,
          entities: [CartEntity, CartItemEntity, ProductEntity, ProductVariantEntity, CategoryEntity, OutboxEntity],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([CartEntity, CartItemEntity, ProductEntity, ProductVariantEntity, CategoryEntity, OutboxEntity]),
      ],
      providers: [
        // Mock dependencies first (before services that depend on them)
        {
          provide: AmqpConnection,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
        // Services
        UnitOfWorkContextService,
        OutboxService,
        EventBusService,
        // Repositories
        CartRepository,
        ProductRepository,
        {
          provide: CART_REPOSITORY_TOKEN,
          useClass: CartRepository,
        },
        {
          provide: PRODUCT_REPOSITORY_TOKEN,
          useClass: ProductRepository,
        },
        // Handlers
        AddToCartCommandHandler,
      ],
    }).compile();

    handler = module.get<AddToCartCommandHandler>(AddToCartCommandHandler);
    cartRepository = module.get<CartRepository>(CartRepository);
    productRepository = module.get<ProductRepository>(ProductRepository);
    eventBus = module.get<EventBus>(EventBus);
    cartEntityRepository = dataSource.getRepository(CartEntity);
    cartItemEntityRepository = dataSource.getRepository(CartItemEntity);
    productEntityRepository = dataSource.getRepository(ProductEntity);
    categoryEntityRepository = dataSource.getRepository(CategoryEntity);

    // Save test category to database
    await categoryEntityRepository.save(categoryEntity);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  beforeEach(async () => {
    // Clear database before each test (keep category)
    await cartItemEntityRepository.delete({});
    await cartEntityRepository.delete({});
    await productEntityRepository.delete({});
    // Note: We keep the category as it's created in beforeAll
  });

  describe('execute', () => {
    it('should create a new cart and add an item', async () => {
      // Arrange
      const userId = uuidv4();
      const product = await createAndSaveProduct('Test Product', 99.99, 'TEST-001');

      const command = new AddToCartCommand(userId, product.id, 2);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(product.id);
      expect(result.items[0].productName).toBe('Test Product');
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].unitPrice).toBe(99.99);
      expect(result.itemCount).toBe(2);
      expect(result.totalAmount).toBe(199.98);

      // Verify cart was saved
      const savedCart = await cartRepository.findActiveByUserId(userId);
      expect(savedCart).toBeDefined();
      expect(savedCart?.items).toHaveLength(1);
    });

    it('should add item to existing cart', async () => {
      // Arrange
      const userId = uuidv4();
      const product1 = await createAndSaveProduct('Product 1', 50.00, 'PROD-001');
      const product2 = await createAndSaveProduct('Product 2', 75.00, 'PROD-002');

      // Add first product
      const command1 = new AddToCartCommand(userId, product1.id, 1);
      await handler.execute(command1);

      // Add second product
      const command2 = new AddToCartCommand(userId, product2.id, 2);
      const result = await handler.execute(command2);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.itemCount).toBe(3); // 1 + 2
      expect(result.totalAmount).toBe(200.00); // 50 + 150
    });

    it('should update quantity when adding same product again', async () => {
      // Arrange
      const userId = uuidv4();
      const product = await createAndSaveProduct('Test Product', 99.99, 'TEST-001');

      // Add product first time
      const command1 = new AddToCartCommand(userId, product.id, 2);
      await handler.execute(command1);

      // Add same product again
      const command2 = new AddToCartCommand(userId, product.id, 3);
      const result = await handler.execute(command2);

      // Assert - should have one item with combined quantity
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(5); // 2 + 3
      expect(result.itemCount).toBe(5);
      expect(result.totalAmount).toBe(499.95); // 99.99 * 5
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      const userId = uuidv4();
      const nonExistentProductId = uuidv4();

      const command = new AddToCartCommand(userId, nonExistentProductId, 1);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Product with ID');
    });

    it('should handle product with variant', async () => {
      // Arrange
      const userId = uuidv4();
      const variant = createVariant('VARIANT-SKU', 10.00);
      const product = await createAndSaveProduct('Test Product', 100.00, 'TEST-001', [variant]);

      const command = new AddToCartCommand(userId, product.id, 1, variant.id);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].unitPrice).toBe(110.00); // 100 + 10 (priceDelta)
      expect(result.items[0].sku).toBe('VARIANT-SKU');
    });

    it('should calculate correct itemCount and totalAmount', async () => {
      // Arrange
      const userId = uuidv4();
      const product1 = await createAndSaveProduct('Product 1', 10.00, 'PROD-001');
      const product2 = await createAndSaveProduct('Product 2', 20.00, 'PROD-002');

      // Add multiple items
      await handler.execute(new AddToCartCommand(userId, product1.id, 3));
      const result = await handler.execute(new AddToCartCommand(userId, product2.id, 2));

      // Assert
      expect(result.itemCount).toBe(5); // 3 + 2
      expect(result.totalAmount).toBe(70.00); // (10 * 3) + (20 * 2)
    });
  });
});

