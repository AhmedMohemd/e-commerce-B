import { Types } from "mongoose";
import { IBrand } from "./brand.interface";
import { IUser } from "./user.interface";
import { ICategory } from "./category.interface";


export interface IProduct { 

    name: string;
    description: string;
    slug: string;

    productId: string;
    image: string;
    gallery?: string[];

    stock: number;
    rating?: number;

    originalPrice: number;
    salePrice: number;
    discountPercent: number;
    finalPrice: number;


    deletedAt?: Date,
    restoredAt?: Date,

    categoryId: Types.ObjectId | ICategory;
    brandId: Types.ObjectId | IBrand;

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;
    notifyUsers?: Types.ObjectId[] | IUser[];

    createdAt?: Date;
    updatedAt?: Date;
}