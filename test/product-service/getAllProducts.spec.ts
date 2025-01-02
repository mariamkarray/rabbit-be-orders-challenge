import { TestingModule, Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetAllProductsDTO } from 'src/product/dto/get-all-products.dto';
import { ProductRepository } from 'src/product/product.repository';
import { ProductService } from 'src/product/product.service';
import { PushoverService } from 'src/pushover/pushover.service';
import { RedisService } from 'src/redis/redis.service';

describe('getAllProducts', () => {
  let productService: ProductService;
  let prismaService: { product: { findMany: jest.Mock } };
  let redisService: { get: jest.Mock; set: jest.Mock };
  let pushoverService: PushoverService;
  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    prismaService = {
      product: {
        findMany: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        PrismaService,
        ProductRepository,
        ProductService,
        PushoverService,
        { provide: RedisService, useValue: redisService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    productService = module.get<ProductService>(ProductService);
  });

  it('should fetch products from the cache if available', async () => {
    const filters = { categories: ['electronics'], skip: 0, take: 10 };
    const cachedProducts = [{ id: 1, name: 'Laptop' }];
    redisService.get.mockResolvedValue(JSON.stringify(cachedProducts));

    const result = await productService.getAllProducts(filters);

    expect(redisService.get).toHaveBeenCalledWith(
      `products:${JSON.stringify(filters)}`,
    );
    expect(result).toEqual(cachedProducts);
    expect(prismaService.product.findMany).not.toHaveBeenCalled();
  });

  it('should fetch products from the database if not cached and update the cache', async () => {
    const filters = { categories: ['electronics'], skip: 0, take: 10 };
    const dbProducts = [{ id: 1, name: 'Laptop' }];
    redisService.get.mockResolvedValue(null);
    prismaService.product.findMany.mockResolvedValue(dbProducts);

    const result = await productService.getAllProducts(filters);

    expect(redisService.get).toHaveBeenCalledWith(
      `products:${JSON.stringify(filters)}`,
    );
    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: { category: { in: ['electronics'] } },
      cursor: undefined,
      skip: 0,
      take: 10,
    });
    expect(redisService.set).toHaveBeenCalledWith(
      `products:${JSON.stringify(filters)}`,
      JSON.stringify(dbProducts),
      'EX',
      60,
    );
    expect(result).toEqual(dbProducts);
  });

  it('should handle pagination parameters correctly', async () => {
    const filters = { categories: ['electronics'], skip: 5, take: 15 };
    const dbProducts = [{ id: 2, name: 'Smartphone' }];
    redisService.get.mockResolvedValue(null);
    prismaService.product.findMany.mockResolvedValue(dbProducts);

    const result = await productService.getAllProducts(filters);

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: { category: { in: ['electronics'] } },
      cursor: undefined,
      skip: 5,
      take: 15,
    });
    expect(result).toEqual(dbProducts);
  });

  it('should handle cursor pagination correctly', async () => {
    const filters = { categories: ['electronics'], cursor: 10, take: 10 };
    const dbProducts = [{ id: 3, name: 'Tablet' }];
    redisService.get.mockResolvedValue(null);
    prismaService.product.findMany.mockResolvedValue(dbProducts);

    const result = await productService.getAllProducts(filters);

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: { category: { in: ['electronics'] } },
      skip: 0,
      cursor: { id: 10 },
      take: 10,
    });
    expect(result).toEqual(dbProducts);
  });

  it('should handle cases with no filters', async () => {
    const filters = { skip: 0, take: 20 };
    const dbProducts = [{ id: 4, name: 'Monitor' }];
    redisService.get.mockResolvedValue(null);
    prismaService.product.findMany.mockResolvedValue(dbProducts);

    const result = await productService.getAllProducts(filters);

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      cursor: undefined,
      take: 20,
    });
    expect(result).toEqual(dbProducts);
  });
});
