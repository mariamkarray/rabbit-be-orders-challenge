import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';

@Injectable()
export class ProductRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }

  async findById(id: number): Promise<Product | null> {
    if (!id) {
      throw new BadRequestException(
        'The id parameter is required and cannot be empty.',
      );
    }
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    area: string;
    category: string;
  }): Promise<Product> {
    try {
      return await this.prisma.product.create({ data });
    } catch (error) {
      console.error('Error in Product Repository:', error);
      throw new BadRequestException('Failed to create product');
    }
  }
}
