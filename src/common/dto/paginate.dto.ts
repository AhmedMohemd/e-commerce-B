import { ArgsType, Field, Int } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class PaginatedDto {

    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @IsOptional()
    size?: number;

    @IsString()
    @IsOptional()
    search?: string;
}
@ArgsType()
export class PaginateGQLDto {

    @Field(() => Int, { nullable: true })
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;
    @Field(() => Int, { nullable: true })
    @IsInt()
    @Min(1)
    @IsOptional()
    size?: number;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    search?: string;
}