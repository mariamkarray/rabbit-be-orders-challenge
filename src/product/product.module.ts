import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductRepository } from './product.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { PushoverService } from 'src/pushover/pushover.service';

@Module({
  controllers: [ProductController],
  providers: [
    PrismaService,
    ProductService,
    ProductRepository,
    RedisService,
    PushoverService,
  ],
})
export class ProductModule {}
