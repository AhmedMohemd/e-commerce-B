import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandModel, ProductModel ,CategoryModel } from 'src/model';
import { BrandRepository, CategoryRepository, ProductRepository } from 'src/common/repository';
import { S3Service } from 'src/common/utils/service';

@Module({
  imports:[CategoryModel, BrandModel , ProductModel ],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, BrandRepository, ProductRepository ,S3Service],
})
export class CategoryModule { }
[]