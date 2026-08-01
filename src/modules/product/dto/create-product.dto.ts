import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsPositive, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { Types } from "mongoose";
import { IsGte } from "src/common/decorator";
import { IBrand, ICategory, IProduct } from "src/common/interfaces";

export class CreateProductDto implements Partial<IProduct> {

    @MaxLength(5000)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    name!: string;

    @MaxLength(50000)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    description!: string;

    @Transform(({ value }) => Number(value))
    @IsPositive()
    @Min(0)
    stock!: number;

    @Transform(({ value }) => Number(value))
    @Min(0)
    @IsPositive()
    originalPrice!: number;

    @Transform(({ value }) => Number(value))
    @IsPositive()
    @Min(0)
    @IsGte(['originalPrice'])
    salePrice!: number;

    @Transform(({ value }) => Number(value))
    @IsPositive()
    @Min(0)
    @Max(100)
    @IsOptional()
    discountPercent?: number;

    @IsMongoId()
    categoryId!: Types.ObjectId;
    @IsMongoId()
    brandId?: Types.ObjectId;
}

// @InputType()
@ArgsType()
export class SayHiInputsDto {

    @Field(() => String, {nullable:true})
    @IsString()
    @IsOptional()
    name?: string;

    @Field(() => Int, { nullable: true })
    @IsInt()
    @IsOptional()
    age?: number;
}