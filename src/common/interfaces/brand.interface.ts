import { Types } from "mongoose";
import { IUser } from "./user.interface";

export interface IBrand {
  name: string;
  slug: string;
  image: string;
  deletedAt?: Date;
  restoredAt?: Date;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
}