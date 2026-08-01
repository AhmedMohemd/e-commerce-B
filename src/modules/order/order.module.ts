import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartModel, CouponModel, OrderModel, ProductModel } from 'src/model';
import { CartRepository, CouponRepository, OrderRepository, ProductRepository } from 'src/common/repository';
import { CartService } from '../cart/cart.service';
import { PaymentService } from 'src/common/utils/service';
import { RealtimeGateway } from '../realtime/realtime.geteway';

@Module({
  imports: [OrderModel, ProductModel, CartModel, CouponModel],
  controllers: [OrderController],
  providers: [RealtimeGateway ,OrderService, OrderRepository, ProductRepository, CartRepository, CouponRepository, CartService, PaymentService],
})
export class OrderModule { }
