import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ArrayUnique, IsArray, IsMongoId, IsString } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {

    @IsString({ each: true })
    @IsArray()
    @ArrayUnique()
    removeGallery?: string[]
}

export class UpdateProductParamsDto {
    @IsMongoId()
    productId!: string;
}