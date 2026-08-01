import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { toObjectId } from 'src/common/utils/object_Id';

export class UpdateBrandDto extends PartialType(CreateBrandDto) { }
export class UpdateBrandParamsDto {
    // @Transform(({ value }) => {return toObjectId(value) })
    @IsMongoId()
    brandId!: Types.ObjectId | string 
}