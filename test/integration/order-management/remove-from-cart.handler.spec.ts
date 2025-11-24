import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { RemoveFromCartCommandHandler } from '../../../src/modules/order-management/application/handlers/remove-from-cart.handler';
import { RemoveFromCartCommand } from '../../../src/modules/order-management/application/commands/remove-from-cart.command';
import { CartRepository } from '../../../src/modules/order-management/infrastructure/persistence/repositories/cart.repository';
import { CartEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart.entity';
import { CartItemEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart-item.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { Cart } from '../../../src/modules/order-management/domain/aggregates/cart';
import { v4 as uuidv4 } from 'uuid';

describe('RemoveFromCartCommandHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: RemoveFromCartCommandHandler;
  let cartRepository: CartRepository;
  let cartEntityRepository: Repository<CartEntity>;
  let eventBus: EventBus;

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
        RemoveFromCartCommandHandler,
        CartRepository,
        {
          provide: 'ICartRepository',
          useClass: CartRepository,
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<RemoveFromCartCommandHandler>(RemoveFromCartCommandHandler);
    cartRepository = module.get<CartRepository>(CartRepository);
    eventBus = module.get<EventBus>(EventBus);
    cartEntityRepository = dataSource.getRepository(CartEntity);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  beforeEach(async () => {
    // Clear database before each test
    await TestDatabaseHelper.clearDatabase(dataSource);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should remove item from cart', async () => {
      // Arrange
      const userId = uuidv4();
      const cart = Cart.create(userId);

      cart.addItem({
        productId: uuidv4(),
        productName: 'Product 1',
        sku: 'PROD-001',
        quantity: 2,
        unitPrice: 50.00,
        currency: 'USD',
      });

      cart.addItem({
        productId: uuidv4(),
        productName: 'Product 2',
        sku: 'PROD-002',
        quantity: 1,
        unitPrice: 75.00,
        currency: 'USD',
      });

      await cartRepository.save(cart);
      const itemIdToRemove = cart.items[0].id;

      const command = new RemoveFromCartCommand(userId, itemIdToRemove);

      // Act
      await handler.execute(command);

      // Assert
      const updatedCart = await cartRepository.findActiveByUserId(userId);
      expect(updatedCart).toBeDefined();
      expect(updatedCart?.items).toHaveLength(1);
      expect(updatedCart?.items[0].productName).toBe('Product 2');
      expect(updatedCart?.itemCount).toBe(1);
      expect(updatedCart?.totalAmount).toBe(75.00);
    });

    it('should throw NotFoundException when cart does not exist', async () => {
      // Arrange
      const userId = uuidv4();
      const itemId = uuidv4();
      const command = new RemoveFromCartCommand(userId, itemId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Cart not found');
    });

    it('should remove last item and leave empty cart', async () => {
      // Arrange
      const userId = uuidv4();
      const cart = Cart.create(userId);

      cart.addItem({
        productId: uuidv4(),
        productName: 'Test Product',
        sku: 'TEST-001',
        quantity: 1,
        unitPrice: 99.99,
        currency: 'USD',
      });

      await cartRepository.save(cart);
      const itemId = cart.items[0].id;

      const command = new RemoveFromCartCommand(userId, itemId);

      // Act
      await handler.execute(command);

      // Assert
      const updatedCart = await cartRepository.findActiveByUserId(userId);
      expect(updatedCart).toBeDefined();
      expect(updatedCart?.items).toHaveLength(0);
      expect(updatedCart?.itemCount).toBe(0);
      expect(updatedCart?.totalAmount).toBe(0);
    });
  });
});

