import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from 'src/product/product.service';
import { ProductRepository } from 'src/product/product.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { GetAllProductsDTO } from 'src/product/dto/get-all-products.dto';
import { PushoverService } from 'src/pushover/pushover.service';

describe('ProductService - getTopProducts', () => {
  let service: ProductService;
  let redisService: { get: jest.Mock; set: jest.Mock };
  let prismaService: { orderItem: any; product: any };

  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    prismaService = {
      orderItem: { groupBy: jest.fn() },
      product: { findMany: jest.fn() },
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

    service = module.get<ProductService>(ProductService);
  });

  it('should throw BadRequestException if area is not provided', async () => {
    await expect(service.getTopProducts('')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getTopProducts('')).rejects.toThrow(
      'Area must be provided',
    );
  });

  it('should return cached data if present', async () => {
    const cachedData = JSON.stringify([
      {
        id: 1,
        name: 'Product 1',
        category: 'Category 1',
        totalOrders: 100,
      },
    ]);
    redisService.get.mockResolvedValue(cachedData);

    const result = await service.getTopProducts('test-area');
    expect(result).toEqual(JSON.parse(cachedData));
    expect(redisService.get).toHaveBeenCalledWith('top-products:test-area');
    expect(prismaService.orderItem.groupBy).not.toHaveBeenCalled();
  });

  it('should fetch data from the database if not cached', async () => {
    redisService.get.mockResolvedValue(null);
    prismaService.orderItem.groupBy.mockResolvedValue([
      { productId: 1, _sum: { quantity: 100 } },
    ]);
    prismaService.product.findMany.mockResolvedValue([
      { id: 1, name: 'Product 1', category: 'Category 1' },
    ]);

    const result = await service.getTopProducts('test-area');
    expect(redisService.get).toHaveBeenCalledWith('top-products:test-area');
    expect(prismaService.orderItem.groupBy).toHaveBeenCalledWith({
      by: ['productId'],
      where: { product: { area: 'test-area' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });
    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
    });
    expect(result).toEqual([
      { id: 1, name: 'Product 1', category: 'Category 1', totalOrders: 100 },
    ]);
  });

  it('should throw BadRequestException if no products are found for the area', async () => {
    redisService.get.mockResolvedValue(null);
    prismaService.orderItem.groupBy.mockResolvedValue([]);

    await expect(service.getTopProducts('test-area')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getTopProducts('test-area')).rejects.toThrow(
      'No top products found for the area: test-area',
    );
  });

  it('should cache results after fetching from the database', async () => {
    redisService.get.mockResolvedValue(null);
    prismaService.orderItem.groupBy.mockResolvedValue([
      { productId: 1, _sum: { quantity: 100 } },
    ]);
    prismaService.product.findMany.mockResolvedValue([
      { id: 1, name: 'Product 1', category: 'Category 1' },
    ]);

    const result = await service.getTopProducts('test-area');
    expect(redisService.set).toHaveBeenCalledWith(
      'top-products:test-area',
      JSON.stringify(result),
      'EX',
      service['CACHE_TTL_SECONDS'],
    );
  });
});
