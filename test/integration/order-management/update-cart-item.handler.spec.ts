import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { UpdateCartItemCommandHandler } from '../../../src/modules/order-management/application/handlers/update-cart-item.handler';
import { UpdateCartItemCommand } from '../../../src/modules/order-management/application/commands/update-cart-item.command';
import { CartRepository } from '../../../src/modules/order-management/infrastructure/persistence/repositories/cart.repository';
import { CartEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart.entity';
import { CartItemEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/cart-item.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { Cart } from '../../../src/modules/order-management/domain/aggregates/cart';
import { v4 as uuidv4 } from 'uuid';

describe('UpdateCartItemCommandHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: UpdateCartItemCommandHandler;
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
        UpdateCartItemCommandHandler,
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

    handler = module.get<UpdateCartItemCommandHandler>(UpdateCartItemCommandHandler);
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
    it('should update item quantity in cart', async () => {
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
      const itemId = cart.items[0].id;

      const command = new UpdateCartItemCommand(userId, itemId, 5);

      // Act
      await handler.execute(command);

      // Assert
      const updatedCart = await cartRepository.findActiveByUserId(userId);
      expect(updatedCart).toBeDefined();
      expect(updatedCart?.items).toHaveLength(1);
      expect(updatedCart?.items[0].quantity).toBe(5);
      expect(updatedCart?.itemCount).toBe(5);
      expect(updatedCart?.totalAmount).toBe(499.95); // 99.99 * 5
    });

    it('should throw NotFoundException when cart does not exist', async () => {
      // Arrange
      const userId = uuidv4();
      const itemId = uuidv4();
      const command = new UpdateCartItemCommand(userId, itemId, 5);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Cart not found');
    });

    it('should update quantity to 1 (minimum)', async () => {
      // Arrange
      const userId = uuidv4();
      const cart = Cart.create(userId);

      cart.addItem({
        productId: uuidv4(),
        productName: 'Test Product',
        sku: 'TEST-001',
        quantity: 5,
        unitPrice: 99.99,
        currency: 'USD',
      });

      await cartRepository.save(cart);
      const itemId = cart.items[0].id;

      const command = new UpdateCartItemCommand(userId, itemId, 1);

      // Act
      await handler.execute(command);

      // Assert
      const updatedCart = await cartRepository.findActiveByUserId(userId);
      expect(updatedCart?.items[0].quantity).toBe(1);
      expect(updatedCart?.itemCount).toBe(1);
    });
  });
});

