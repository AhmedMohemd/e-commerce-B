import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { Types } from 'mongoose';
import { IsMongoId, IsString } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) { }
export class ConfirmOrderParamsDto {
    @IsMongoId()
    orderId!: Types.ObjectId
}


export class CheckoutOrderParamsDto {
    @IsMongoId()
    orderId!: Types.ObjectId
}


export class CheckoutOrderDto {
    @IsString()
    token!: string
}