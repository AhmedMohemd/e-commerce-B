import { IsEnum, IsMongoId, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { Types } from "mongoose";
import { CurrencyTypeEnum, PaymentTypeEnum } from "src/common/enum";
import { IOrder } from "src/common/interfaces";

export class CreateOrderDto implements Partial<IOrder> {

    @MaxLength(5000)
    @MinLength(2)
    @IsString()
    address!: string;
    @Matches(/^(00201|\+201|01)(0|1|2|5)\d{8}$/)
    phone!: string;
    @MaxLength(5000)
    @MinLength(2)
    @IsString()
    @IsOptional()
    note?: string;
    @MaxLength(5000)
    @MinLength(2)
    @IsString()
    @IsOptional()
    couponName?: string | undefined;

    @IsEnum(CurrencyTypeEnum)
    currency!: CurrencyTypeEnum;
    @IsEnum(PaymentTypeEnum)
    paymentType!: PaymentTypeEnum;

}
export class OrderParamsDto {
    @IsMongoId()
    orderId!: Types.ObjectId
}
