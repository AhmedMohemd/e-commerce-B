import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { CurrencyTypeEnum, OrderStatusEnum, PaymentTypeEnum } from "../enum";
import { IProduct } from "./product.interface";
import { ICoupon } from "./coupon.interface";

export interface IOrderProduct {
    productId: Types.ObjectId | IProduct;
    quantity: number;
    unitAmount: number;
    total: number
}
export interface IOrder {
    intentId?: string;
    orderId: string;
    CouponId?: Types.ObjectId | ICoupon;

    address: string;
    phone: string;
    note?: string;

    total: number;
    discountPercent: number;
    subtotal: number

    status: OrderStatusEnum;
    paymentType: PaymentTypeEnum;
    currency: CurrencyTypeEnum;

    cancel?: { userId: Types.ObjectId | IUser, time: Date, note: String };

    paidAt?: Date;
    refundedAt?: Date;

    products: IOrderProduct[]


    deletedAt?: Date;
    restoredAt?: Date;

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;

    createdAt?: Date;
    updatedAt?: Date;
}