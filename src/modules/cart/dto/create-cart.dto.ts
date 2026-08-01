import { IsInt, IsMongoId } from "class-validator";
import { Types } from "mongoose";
import { ICartProduct } from "src/common/interfaces";

export class CreateCartDto implements ICartProduct {
    @IsMongoId()
    productId!: Types.ObjectId;
    @IsInt()
    quantity!: number;
}