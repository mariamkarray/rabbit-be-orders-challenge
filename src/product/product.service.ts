import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetAllProductsDTO } from './dto/get-all-products.dto';
import { ProductDTO } from './dto/product.dto';
import { TopProductDTO } from './dto/top-product.dto';
import { RedisService } from 'src/redis/redis.service';
import { PushoverService } from 'src/pushover/pushover.service';
@Injectable()
export class ProductService {
  // data will be cached for 1 minute
  private readonly CACHE_TTL_SECONDS = 60;

  constructor(
    private readonly productsRepository: ProductRepository,
    private prismaService: PrismaService,
    private redisService: RedisService,
    private pushoverService: PushoverService,
  ) {}
  async createProduct(data: {
    name: string;
    area: string;
    category: string;
  }): Promise<ProductDTO> {
    const createdProduct = await this.productsRepository.create(data);
    try {
      await this.pushoverService.sendNotification({
        title: 'New Product Created',
        message: `A new product "${createdProduct.name}" was created in the "${createdProduct.area}" area.`,
      });
    } catch (error) {
      console.error('Notification failed:', error.message);
    }

    return createdProduct;
  }

  async getAllProducts(filters: GetAllProductsDTO): Promise<ProductDTO[]> {
    // Attempting to retireve cached data
    const cacheKey = `products:${JSON.stringify(filters)}`;
    let cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    const { categories, skip = 0, take = 20, cursor } = filters;
    const cursorOption = cursor ? { id: cursor } : undefined;
    let products = await this.prismaService.product.findMany({
      where: categories?.length ? { category: { in: categories } } : {},
      cursor: cursorOption,
      skip,
      take,
    });
    // Cache the results
    await this.redisService.set(
      cacheKey,
      JSON.stringify(products),
      'EX',
      this.CACHE_TTL_SECONDS,
    );
    return products;
  }

  async getProductById(id: number): Promise<ProductDTO> {
    return this.productsRepository.findById(id);
  }

  async getTopProducts(area: string): Promise<TopProductDTO[]> {
    if (!area || !area.trim()) {
      throw new BadRequestException('Area must be provided');
    }
    // Attempting to retireve cached data
    const cacheKey = `top-products:${area}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    const topProducts = await this.prismaService.orderItem.groupBy({
      by: ['productId'],
      where: { product: { area } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });
    if (topProducts.length === 0) {
      throw new BadRequestException(
        `No top products found for the area: ${area}`,
      );
    }
    // extract the productIDs so we can load the product details
    const productIds = topProducts.map((item) => item.productId);

    // Fetch product details
    const products = await this.prismaService.product.findMany({
      where: { id: { in: productIds } },
    });
    const results: TopProductDTO[] = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Unknown',
        category: product?.category || 'Uncategorized',
        totalOrders: item._sum.quantity || 0,
      };
    });

    // Cache the results
    await this.redisService.set(
      cacheKey,
      JSON.stringify(results),
      'EX',
      this.CACHE_TTL_SECONDS,
    );
    return results;
  }
}
