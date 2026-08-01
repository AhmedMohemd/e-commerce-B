import {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  PopulateOptions,
  ReturnsNewDoc,
  Types,
  UpdateResult,
  QueryOptions,
  UpdateWithAggregationPipeline,
  ProjectionType,
  UpdateQuery,
  QueryFilter,
} from "mongoose";
import { IPaginate, IUser } from "../../common/interfaces";
import { UpdateOptions } from "mongodb";
import { Injectable } from "@nestjs/common";
@Injectable()
export abstract class DatabaseRepository<TRowDocument> {
  constructor(protected readonly model: Model<TRowDocument>) { }
  async insertMany({
    data,
  }: {
    data: AnyKeys<TRowDocument>;
  }): Promise<HydratedDocument<TRowDocument>[]> {
    return (await this.model.insertMany(
      data as any,
    )) as HydratedDocument<TRowDocument>[];
  }
  //create and create one
  async create({
    data,
  }: {
    data: AnyKeys<TRowDocument>;
  }): Promise<HydratedDocument<TRowDocument>>;
  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRowDocument>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRowDocument>[]>;
  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRowDocument> | AnyKeys<TRowDocument>[];
    options?: CreateOptions | undefined;
  }): Promise<
    HydratedDocument<TRowDocument>[] | HydratedDocument<TRowDocument>
  > {
    return await this.model.create(data as any, options);
  }
  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<TRowDocument>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRowDocument>> {
    const [document] = await this.create({
      data: [data],
      options,
    });
    return document as HydratedDocument<TRowDocument>;
  }
  //paginate
  async paginate({
    filter,
    projection,
    options = {},
    page = 0,
    size = 5,
  }: {
    filter?: QueryFilter<TRowDocument>;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?: QueryOptions<TRowDocument>;
    page?: number | string | undefined;
    size?: number | string | undefined;
  }): Promise<IPaginate<TRowDocument>> {
    let count: number = -1;
    if (Number(page) > 0) {
      page = parseInt(page as string);
      size = parseInt(size as string);
      options.skip = (page - 1) * size;
      options.limit = size;
      count = await this.model.countDocuments(filter);
    }
    const docs = await this.find({ filter: filter || {}, projection, options });
    return {
      docs,
      ...(Number(page) > 0
        ? {
          currentPage: page,
          size,
          pages: Math.ceil(count / parseInt(size as string)),
        }
        : {}),
    };
  }
  //find
  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRowDocument>;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?: QueryOptions<TRowDocument> | null | undefined;
  }): Promise<HydratedDocument<TRowDocument>[]> {
    const doc = this.model.find(filter, projection);

    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
    if (options?.sort)doc.sort(options.sort);
    if (options?.skip) doc.skip(options.skip);
    if (options?.limit) doc.limit(options.limit);
    if (options?.lean) doc.lean(options.lean);
    return await doc.exec();
  }
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRowDocument>;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?:
    | (QueryOptions<TRowDocument> & { lean?: false })
    | null
    | undefined;
  }): Promise<HydratedDocument<TRowDocument> | null>;
  // }): Promise<HydratedDocument<TRowDocument> | null>;
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRowDocument>;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?: (QueryOptions<TRowDocument> & { lean?: true }) | null | undefined;
    // }): Promise<null | FlattenMaps<IUser>>;
  }): Promise<null | FlattenMaps<TRowDocument>>;
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRowDocument>;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?: QueryOptions<TRowDocument> | null | undefined;
  }): Promise<any> {
    const document = this.model.findOne(filter, projection);

    if (options?.populate)
      document.populate(options.populate as PopulateOptions[]);
    if (options?.lean) document.lean(options.lean);
    return await document.exec();
  }
  //find by id
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?: (QueryOptions<TRowDocument> & { lean: false }) | null | undefined;
    // }): Promise<HydratedDocument<IUser> | null>;
  }): Promise<HydratedDocument<TRowDocument> | null>;
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?: (QueryOptions<TRowDocument> & { lean: false }) | null | undefined;
  }): Promise<FlattenMaps<IUser> | null>;
  // }): Promise<FlattenMaps<TRowDocument> | null>;
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRowDocument> | null | undefined;
    options?: QueryOptions<TRowDocument> | null | undefined;
  }): Promise<any> {
    const document = this.model.findById(_id, projection);

    if (options?.populate)
      document.populate(options.populate as PopulateOptions[]);
    if (options?.lean) document.lean(options.lean);
    return await document.exec();
  }
  //updateOne and updateMany
  async findOneAndUpdate({
    filter,
    update,
    options = { new: true },
    populate = []
  }: {
    filter: QueryFilter<TRowDocument>;
    update: UpdateQuery<TRowDocument>;
    options?: QueryOptions<TRowDocument>;
    populate?: PopulateOptions[]
  }): Promise<HydratedDocument<TRowDocument> | null> {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: {
            $add: ["$__v", 1],
          },
        },
      });
      return await this.model.findOneAndUpdate(filter, update, {
        ...options,
        updatePipeline: true,
      }).populate(populate);
    }
    return await this.model.findOneAndUpdate(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    ).populate(populate);
  }
  async findByIdAndUpdate({
    _id,
    update,
    options = { new: true },
  }: {
    _id: Types.ObjectId;
    update: UpdateQuery<TRowDocument>;
    options?: QueryOptions<TRowDocument> | ReturnsNewDoc;
  }): Promise<HydratedDocument<TRowDocument> | null> {
    return await this.model.findOneAndUpdate(
      _id,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }
  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRowDocument>;
    update: UpdateQuery<TRowDocument> | UpdateWithAggregationPipeline;
    options?: UpdateOptions | null;
  }): Promise<UpdateResult> {
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }
  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRowDocument>;
    update: UpdateQuery<TRowDocument> | UpdateWithAggregationPipeline;
    options?: UpdateOptions | null;
  }): Promise<UpdateResult> {
    return await this.model.updateMany(filter, update, options);
  }
  //deleteOne and deleteMany
  async findByIdAndDelete({
    _id,
  }: {
    _id: Types.ObjectId;
  }): Promise<HydratedDocument<TRowDocument> | null> {
    return await this.model.findOneAndDelete(_id);
  }
  async findOneAndDelete({
    filter,
  }: {
    filter: QueryFilter<TRowDocument>;
  }): Promise<HydratedDocument<TRowDocument> | null> {
    return await this.model.findOneAndDelete(filter);
  }
  async deleteOne({
    filter,
  }: {
    filter: QueryFilter<TRowDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }
  async deleteMany({
    filter,
  }: {
    filter: QueryFilter<TRowDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }
}