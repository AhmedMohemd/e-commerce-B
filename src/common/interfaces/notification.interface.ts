import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { NotificationTypeEnum } from "../enum";
export interface INotification {
  title: string;
  body: string;
  type: NotificationTypeEnum;
  data?: Record<string, unknown>;
  image?: string;
  recipients?: Types.ObjectId[] | IUser[];
  sendToAll?: boolean;
  isRead?: boolean;
  readAt?: Date;
  createdBy: Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}