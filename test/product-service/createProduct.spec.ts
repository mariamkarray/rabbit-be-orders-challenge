import { ProductService } from 'src/product/product.service';
import { ProductRepository } from 'src/product/product.repository';
import { PushoverService } from 'src/pushover/pushover.service';
import { BadRequestException } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ProductService - createProduct', () => {
  let productService: ProductService;
  let productRepository: { create: jest.Mock };
  let pushoverService: { sendNotification: jest.Mock };
  let redisService: { get: jest.Mock; set: jest.Mock };
  let prismaService: { orderItem: any; product: any };

  beforeEach(() => {
    productRepository = {
      create: jest.fn(),
    };

    pushoverService = {
      sendNotification: jest.fn(),
    };

    productService = new ProductService(
      productRepository as unknown as ProductRepository,
      prismaService as unknown as PrismaService,
      redisService as unknown as RedisService,
      pushoverService as unknown as PushoverService,
    );
  });

  it('should create a product successfully and send a notification', async () => {
    const productData = {
      name: 'Test Product',
      area: 'Test Area',
      category: 'Test Category',
    };
    const createdProduct = { id: 1, ...productData };

    productRepository.create.mockResolvedValue(createdProduct);
    pushoverService.sendNotification.mockResolvedValue(undefined);

    const result = await productService.createProduct(productData);

    expect(productRepository.create).toHaveBeenCalledWith(productData);
    expect(pushoverService.sendNotification).toHaveBeenCalledWith({
      title: 'New Product Created',
      message: `A new product "Test Product" was created in the "Test Area" area.`,
    });
    expect(result).toEqual(createdProduct);
  });
  it('should create a product but handle notification failure gracefully', async () => {
    const productData = {
      name: 'Test Product',
      area: 'Test Area',
      category: 'Test Category',
    };
    const createdProduct = { id: 1, ...productData };

    productRepository.create.mockResolvedValue(createdProduct);
    pushoverService.sendNotification.mockRejectedValue(
      new Error('Notification failed'),
    );

    const result = await productService.createProduct(productData);

    // Ensure the product is created
    expect(productRepository.create).toHaveBeenCalledWith(productData);

    // Ensure the notification attempt is made
    expect(pushoverService.sendNotification).toHaveBeenCalledWith({
      title: 'New Product Created',
      message: `A new product "Test Product" was created in the "Test Area" area.`,
    });

    // Verify that the created product is returned
    expect(result).toEqual(createdProduct);
  });

  it('should throw BadRequestException if product creation fails', async () => {
    const productData = {
      name: 'Test Product',
      area: 'Test Area',
      category: 'Test Category',
    };

    productRepository.create.mockRejectedValue(new Error('Database error'));

    await expect(productService.createProduct(productData)).rejects.toThrow(
      Error,
    );
    await expect(productService.createProduct(productData)).rejects.toThrow(
      'Database error',
    );

    expect(productRepository.create).toHaveBeenCalledWith(productData);
    expect(pushoverService.sendNotification).not.toHaveBeenCalled();
  });

  it('should not proceed with notification if product creation fails', async () => {
    const productData = {
      name: 'Test Product',
      area: 'Test Area',
      category: 'Test Category',
    };

    productRepository.create.mockRejectedValue(new Error('Database error'));

    await expect(productService.createProduct(productData)).rejects.toThrow(
      Error,
    );

    expect(productRepository.create).toHaveBeenCalledWith(productData);
    expect(pushoverService.sendNotification).not.toHaveBeenCalled();
  });
});
