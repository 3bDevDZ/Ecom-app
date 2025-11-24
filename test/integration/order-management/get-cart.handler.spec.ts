import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GetCartQueryHandler } from '../../../src/modules/order-management/application/handlers/get-cart.handler';
import { GetCartQuery } from '../../../src/modules/order-management/application/queries/get-cart.query';
import { CartRepository } from '../../../src/modules/order-management/infrastructure/persistence/repositories/cart.repository';
import { CartEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart.entity';
import { CartItemEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart-item.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { Cart } from '../../../src/modules/order-management/domain/aggregates/cart';
import { v4 as uuidv4 } from 'uuid';

describe('GetCartQueryHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: GetCartQueryHandler;
  let cartRepository: CartRepository;
  let cartEntityRepository: Repository<CartEntity>;

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([
      CartEntity,
      CartItemEntity,
    ]);

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
        GetCartQueryHandler,
        CartRepository,
        {
          provide: 'ICartRepository',
          useClass: CartRepository,
        },
      ],
    }).compile();

    handler = module.get<GetCartQueryHandler>(GetCartQueryHandler);
    cartRepository = module.get<CartRepository>(CartRepository);
    cartEntityRepository = dataSource.getRepository(CartEntity);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  beforeEach(async () => {
    // Clear database before each test
    await TestDatabaseHelper.clearDatabase(dataSource);
  });

  describe('execute', () => {
    it('should return null when user has no cart', async () => {
      // Arrange
      const userId = uuidv4();
      const query = new GetCartQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
    });

    it('should return cart with items when cart exists', async () => {
      // Arrange
      const userId = uuidv4();
      const cart = Cart.create(userId);

      cart.addItem({
        productId: uuidv4(),
        productName: 'Test Product',
        sku: 'TEST-001',
        quantity: 2,
        unitPrice: 99.99,
        currency: 'USD',
      });

      await cartRepository.save(cart);

      const query = new GetCartQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result?.userId).toBe(userId);
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].productName).toBe('Test Product');
      expect(result?.items[0].quantity).toBe(2);
      expect(result?.itemCount).toBe(2);
      expect(result?.totalAmount).toBe(199.98);
    });

    it('should return cart with multiple items', async () => {
      // Arrange
      const userId = uuidv4();
      const cart = Cart.create(userId);

      cart.addItem({
        productId: uuidv4(),
        productName: 'Product 1',
        sku: 'PROD-001',
        quantity: 1,
        unitPrice: 50.00,
        currency: 'USD',
      });

      cart.addItem({
        productId: uuidv4(),
        productName: 'Product 2',
        sku: 'PROD-002',
        quantity: 3,
        unitPrice: 25.00,
        currency: 'USD',
      });

      await cartRepository.save(cart);

      const query = new GetCartQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result?.items).toHaveLength(2);
      expect(result?.itemCount).toBe(4); // 1 + 3
      expect(result?.totalAmount).toBe(125.00); // 50 + 75
    });

    it('should return empty cart when cart has no items', async () => {
      // Arrange
      const userId = uuidv4();
      const cart = Cart.create(userId);
      await cartRepository.save(cart);

      const query = new GetCartQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result?.items).toHaveLength(0);
      expect(result?.itemCount).toBe(0);
      expect(result?.totalAmount).toBe(0);
    });

    it('should only return cart for the specified user', async () => {
      // Arrange
      const userId1 = uuidv4();
      const userId2 = uuidv4();

      const cart1 = Cart.create(userId1);
      cart1.addItem({
        productId: uuidv4(),
        productName: 'User 1 Product',
        sku: 'U1-001',
        quantity: 1,
        unitPrice: 100.00,
        currency: 'USD',
      });

      const cart2 = Cart.create(userId2);
      cart2.addItem({
        productId: uuidv4(),
        productName: 'User 2 Product',
        sku: 'U2-001',
        quantity: 1,
        unitPrice: 200.00,
        currency: 'USD',
      });

      await cartRepository.save(cart1);
      await cartRepository.save(cart2);

      const query = new GetCartQuery(userId1);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result?.userId).toBe(userId1);
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].productName).toBe('User 1 Product');
    });
  });
});

