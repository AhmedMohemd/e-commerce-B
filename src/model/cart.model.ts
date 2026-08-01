import { MongooseModule, Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose";
import { ICart, ICartProduct, IUser } from "src/common/interfaces"
export type HCartDocument = HydratedDocument<ICart>
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    // collection: "Cart"
})
export class Cart implements ICart {


    @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
    createdBy!: Types.ObjectId | IUser;

    @Prop([
        raw({
            productId: { type: Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, min: 1, required: true },
        })
    ])
    products!: ICartProduct[];
}
export const CartSchema = SchemaFactory.createForClass(Cart)
export const CartModel = MongooseModule.forFeature([{name: Cart.name, schema: CartSchema}])
