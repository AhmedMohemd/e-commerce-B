import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { ArrayUnique, IsArray, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { IBrand } from 'src/common/interfaces';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsMongoId({ each: true })
    @IsArray()
    @ArrayUnique()
    @IsOptional()
    removeBrandIds?: Types.ObjectId[] | IBrand[] | undefined;
}

export class UpdateCategoryParamsDto {

    @IsMongoId()
    categoryId!: Types.ObjectId | string
}