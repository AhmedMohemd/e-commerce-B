import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose";
import { IBrand, ICategory, IProduct ,  IUser } from "src/common/interfaces"
import { generateSlug } from "src/common/utils/slug";
export type HProductDocument = HydratedDocument<IProduct>
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "Product"
})
export class Product implements IProduct {


    @Prop({ type: String, required: true, minLength: 2, maxLength: 50 })
    name!: string;
    @Prop({ type: String, required: true, minLength: 2, maxLength: 50000 })
    description!: string;
    @Prop({ type: String })
    slug!: string;

    @Prop({ type: String, required: true })
    productId!: string;
    @Prop({ type: String })
    image!: string;
    @Prop({ type: [String] })
    gallery?: string[];

    
    @Prop({ type: Types.ObjectId, ref: "Brand", required: true })
    brandId!: Types.ObjectId | IBrand;
    @Prop({ type: Types.ObjectId, ref: "Category", required: true })
    categoryId!: Types.ObjectId | ICategory;

    @Prop({ type: Number, required: true, min: 0 })
    originalPrice!: number;
    @Prop({ type: Number, required: true, min: 0 })
    salePrice!: number;


    @Prop({ type: Number, default: 0, min: 0, max: 100 })
    discountPercent!: number;
    @Prop({ type: Number, required: true, min: 0 })
    finalPrice!: number;

    @Prop({ type: Number, required: true, min: 0 })
    stock!: number;
    @Prop({ type: Number, max: 5, min: 0 })
    rating?: number | undefined;


    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    createdBy!: Types.ObjectId | IUser;
    @Prop({ type: Types.ObjectId, ref: "User" })
    updatedBy?: Types.ObjectId | IUser | undefined;
    @Prop([{ type: Types.ObjectId, ref: "User" }])
    notifyUsers?: Types.ObjectId[] | IUser[] | undefined;
    @Prop({ type: Date })
    deletedAt?: Date;
    @Prop({ type: Date })
    restoredAt?: Date;

}
export const ProductSchema = SchemaFactory.createForClass(Product)
export const ProductModel = MongooseModule.forFeatureAsync([
    {
        name: Product.name,
        useFactory: () => {
            ProductSchema.pre(["find", "findOne"], function () {
                if (this.getQuery().paranoid == false) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: false }
                    })
                }
            })
            ProductSchema.pre(["updateOne", "findOneAndUpdate"], function () {

                const update = this.getUpdate() as HydratedDocument<IUser>

                if (update.deletedAt) {
                    this.getQuery().paranoId = true
                    this.setUpdate({
                        ...this.getUpdate(),
                        $unset: { restoredAt: 1 }
                    })
                }

                if (update.restoredAt) {
                    this.setQuery({
                        ...this.getQuery(),
                        paranoid: false,
                        deletedAt: { $exists: true }
                    })
                    this.setUpdate({
                        ...this.getUpdate(),
                        $unset: { deletedAt: 1 }
                    })
                }
                if (this.getQuery().paranoid == false) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: false }
                    })
                }
                console.log(this.getQuery());

            })


            ProductSchema.pre(["deleteOne", "findOneAndDelete"], function () {

                if (this.getQuery().force == true) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: true }
                    })
                }
            })


            ProductSchema.pre("save", async function (this: HydratedDocument<IProduct> & { wasNew: boolean }) {
                if (this.isModified("name")) {
                    this.slug = generateSlug(this.name)
                }
            })
            return ProductSchema;
        }
    },
])