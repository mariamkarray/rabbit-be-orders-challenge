import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetAllProductsDTO } from './dto/get-all-products.dto';
import { TopProductDTO } from './dto/top-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productsService: ProductService) {}

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.createProduct(createProductDto);
    return {
      message: 'Product created successfully',
      product,
    };
  }

  @Get()
  async getAllProducts(@Query() filters: GetAllProductsDTO) {
    return this.productsService.getAllProducts(filters);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    if (!id || id.trim() === '') {
      throw new BadRequestException(
        'The id parameter is required and cannot be empty.',
      );
    }
    return this.productsService.getProductById(Number(id));
  }

  @Get('top-products/:area')
  async getTopProducts(@Param('area') area: string) {
    if (!area || area.trim() === '' || area == '') {
      throw new BadRequestException('Area must be provided');
    }
    return this.productsService.getTopProducts(area);
  }
}
