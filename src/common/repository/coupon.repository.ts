import { InjectModel } from "@nestjs/mongoose";
import { ICoupon } from "../interfaces";
import { DatabaseRepository } from "./base.repository";
import { Coupon } from "src/model";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
@Injectable()
export class CouponRepository extends DatabaseRepository<ICoupon> {
  constructor(@InjectModel(Coupon.name) protected readonly model: Model<ICoupon>) {
    super(model)
  }
}