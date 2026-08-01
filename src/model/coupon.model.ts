import { MongooseModule, Prop, raw, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose";
import { CouponTypeEnum } from "src/common/enum";
import { ICoupon, IUser } from "src/common/interfaces"
import { generateSlug } from "src/common/utils/slug";
export type HCouponDocument = HydratedDocument<ICoupon>
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    // collection: "Coupon"
})
export class Coupon implements ICoupon {

    @Prop({ type: Number, min: 0, required: true })
    discount!: number;
    @Prop({ type: Number, enum: CouponTypeEnum, default: CouponTypeEnum.PERCENTAGE })
    type!: CouponTypeEnum;
    @Prop({ type: Number, min: 1, default: 1 })
    duration!: number;
    @Prop({ type: Date, required: true })
    startDate!: Date;
    @Prop({ type: Date, required: true })
    endDate!: Date;
    @Prop({
        type: [
            raw({
                userId: { type: Types.ObjectId, ref: "User", required: true },
                orderId: { type: Types.ObjectId, ref: "Order", required: true },
                time: { type: Date, required: true },
            })
        ],
        required: false
    })
    usedBy!: { userId: Types.ObjectId; orderId:Types.ObjectId;  time: Date; }[];

    @Prop({ type: String, required: true, unique: true, minLength: 2, maxLength: 50 })
    name!: string;
    @Prop({ type: String })
    slug!: string;

    @Prop({ type: String })
    image!: string;
    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    createdBy!: Types.ObjectId | IUser;
    @Prop({ type: Types.ObjectId, ref: "User" })
    updatedBy?: Types.ObjectId | IUser | undefined;

    @Prop({ type: Date })
    deletedAt?: Date;
    @Prop({ type: Date })
    restoredAt?: Date;

}
export const CouponSchema = SchemaFactory.createForClass(Coupon)
export const CouponModel = MongooseModule.forFeatureAsync([
    {
        name: Coupon.name,
        useFactory: () => {
            CouponSchema.pre(["find", "findOne"], function () {
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
            CouponSchema.pre(["updateOne", "findOneAndUpdate"], function () {

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


            CouponSchema.pre(["deleteOne", "findOneAndDelete"], function () {

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


            CouponSchema.pre("save", async function (this: HydratedDocument<ICoupon> & { wasNew: boolean }) {
                if (this.isModified("name")) {
                    this.slug = generateSlug(this.name)
                }
            })
            return CouponSchema;
        }
    },
])