import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { AddToCartCommandHandler } from '../../../src/modules/order-management/application/handlers/add-to-cart.handler';
import { AddToCartCommand } from '../../../src/modules/order-management/application/commands/add-to-cart.command';
import { CartRepository } from '../../../src/modules/order-management/infrastructure/persistence/repositories/cart.repository';
import { CartEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart.entity';
import { CartItemEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart-item.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { v4 as uuidv4 } from 'uuid';
import { QueryBus } from '@nestjs/cqrs';
import { ProductDto } from '../../../src/modules/product-catalog/application/dtos/product.dto';
import { ProductImageDto } from '../../../src/modules/product-catalog/application/dtos/product.dto';
import { ProductVariantDto } from '../../../src/modules/product-catalog/application/dtos/product-variant.dto';

describe('AddToCartCommandHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: AddToCartCommandHandler;
  let cartRepository: CartRepository;
  let cartEntityRepository: Repository<CartEntity>;
  let cartItemEntityRepository: Repository<CartItemEntity>;
  let queryBus: QueryBus;
  let eventBus: EventBus;

  // Helper to create mock product
  const createMockProduct = (id: string, name: string, price: number, sku: string): ProductDto => {
    return new ProductDto(
      id,
      sku,
      name,
      'Test product description',
      uuidv4(),
      'Test Brand',
      [new ProductImageDto('https://example.com/image.jpg', 'Test Image', 1, true)],
      [],
      price,
      'USD',
      1,
      null,
      true,
      [],
      new Date(),
      new Date(),
    );
  };

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([
      CartEntity,
      CartItemEntity,
    ]);

    // Create a mock QueryBus that returns products
    const mockExecute = jest.fn();
    const mockQueryBus = {
      execute: mockExecute,
    };

    const module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'postgres',
          database: dataSource.options.database as string,
          entities: [CartEntity, CartItemEntity],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([CartEntity, CartItemEntity]),
      ],
      providers: [
        AddToCartCommandHandler,
        CartRepository,
        {
          provide: 'ICartRepository',
          useClass: CartRepository,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<AddToCartCommandHandler>(AddToCartCommandHandler);
    cartRepository = module.get<CartRepository>(CartRepository);
    queryBus = module.get<QueryBus>(QueryBus);
    eventBus = module.get<EventBus>(EventBus);
    cartEntityRepository = dataSource.getRepository(CartEntity);
    cartItemEntityRepository = dataSource.getRepository(CartItemEntity);

    // Replace queryBus.execute with the mock
    (queryBus as any).execute = mockExecute;
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  beforeEach(async () => {
    // Clear database before each test
    await TestDatabaseHelper.clearDatabase(dataSource);
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new cart and add an item', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const product = createMockProduct(productId, 'Test Product', 99.99, 'TEST-001');

      (queryBus.execute as jest.Mock).mockResolvedValue(product);

      const command = new AddToCartCommand(userId, productId, 2);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(productId);
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
      const productId1 = uuidv4();
      const productId2 = uuidv4();

      const product1 = createMockProduct(productId1, 'Product 1', 50.00, 'PROD-001');
      const product2 = createMockProduct(productId2, 'Product 2', 75.00, 'PROD-002');

      jest.spyOn(queryBus, 'execute')
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      // Add first product
      const command1 = new AddToCartCommand(userId, productId1, 1);
      await handler.execute(command1);

      // Add second product
      const command2 = new AddToCartCommand(userId, productId2, 2);
      const result = await handler.execute(command2);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.itemCount).toBe(3); // 1 + 2
      expect(result.totalAmount).toBe(200.00); // 50 + 150
    });

    it('should update quantity when adding same product again', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const product = createMockProduct(productId, 'Test Product', 99.99, 'TEST-001');

      (queryBus.execute as jest.Mock).mockResolvedValue(product);

      // Add product first time
      const command1 = new AddToCartCommand(userId, productId, 2);
      await handler.execute(command1);

      // Add same product again
      const command2 = new AddToCartCommand(userId, productId, 3);
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
      const productId = uuidv4();

      jest.spyOn(queryBus, 'execute').mockResolvedValue(null);

      const command = new AddToCartCommand(userId, productId, 1);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Product with ID');
    });

    it('should handle product with variant', async () => {
      // Arrange
      const userId = uuidv4();
      const productId = uuidv4();
      const variantId = uuidv4();

      const variant = new ProductVariantDto(
        variantId,
        'Variant SKU',
        { color: 'Red' },
        10.00, // priceDelta
        'USD', // currency
        100, // availableQuantity
        0, // reservedQuantity
        true, // isActive
      );

      const product = createMockProduct(productId, 'Test Product', 100.00, 'TEST-001');
      // Add variant to product
      (product as any).variants = [variant];

      (queryBus.execute as jest.Mock).mockResolvedValue(product);

      const command = new AddToCartCommand(userId, productId, 1, variantId);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].unitPrice).toBe(110.00); // 100 + 10 (priceDelta)
      expect(result.items[0].sku).toBe('Variant SKU');
    });

    it('should calculate correct itemCount and totalAmount', async () => {
      // Arrange
      const userId = uuidv4();
      const productId1 = uuidv4();
      const productId2 = uuidv4();

      const product1 = createMockProduct(productId1, 'Product 1', 10.00, 'PROD-001');
      const product2 = createMockProduct(productId2, 'Product 2', 20.00, 'PROD-002');

      jest.spyOn(queryBus, 'execute')
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      // Add multiple items
      await handler.execute(new AddToCartCommand(userId, productId1, 3));
      const result = await handler.execute(new AddToCartCommand(userId, productId2, 2));

      // Assert
      expect(result.itemCount).toBe(5); // 3 + 2
      expect(result.totalAmount).toBe(70.00); // (10 * 3) + (20 * 2)
    });
  });
});

