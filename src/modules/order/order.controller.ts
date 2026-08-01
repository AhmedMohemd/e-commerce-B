import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import {  CreateOrderDto, OrderParamsDto } from './dto/create-order.dto';
import { CheckoutOrderDto, CheckoutOrderParamsDto, ConfirmOrderParamsDto, UpdateOrderDto } from './dto/update-order.dto';
import { RoleEnum } from 'src/common/enum';
import { Auth, User } from 'src/common/decorator';
import type { HUserDocument } from 'src/model';
import { IOrder } from 'src/common/interfaces';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) { }

  @Auth([RoleEnum.USER])
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: HUserDocument
  ): Promise<IOrder> {
    return await this.orderService.create(createOrderDto, user);
  }

  @Auth([RoleEnum.ADMIN])
  @Patch("/:orderId/confirm")
  async confirm(
    @Param() orderParamsDto: OrderParamsDto,
    @User() user: HUserDocument
  ): Promise<IOrder> {
    return await this.orderService.confirm(orderParamsDto, user);
  }
  @Auth([RoleEnum.ADMIN])
  @Patch("/:orderId/cancel")
  async cancel(@Param() confirmOrderParamsDto: ConfirmOrderParamsDto, @User() user: HUserDocument): Promise<IOrder> {
    return await this.orderService.cancel(confirmOrderParamsDto, user);
  }
  @Auth([RoleEnum.USER])
  @Post("/:orderId/checkout")
  async checkout(
    @Param() checkoutOrderParamsDto: CheckoutOrderParamsDto,
    @Body() body: CheckoutOrderDto,
    @User() user: HUserDocument
  ): Promise<any> {
    return await this.orderService.checkout(checkoutOrderParamsDto,body, user);
  }

  @Post("/webhook")
  async webhook(
    @Req() req: Request
  ): Promise<any> {
    return await this.orderService.webhook(req);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
