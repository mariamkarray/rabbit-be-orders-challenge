import { Injectable } from '@nestjs/common';
import { CreateOrderDTO } from './dto/create-order-dto';

@Injectable()
export class OrderService {
  async create(orderData: CreateOrderDTO) {}
}
