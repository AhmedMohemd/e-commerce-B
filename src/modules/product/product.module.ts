import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { BrandModel, CategoryModel, ProductModel } from 'src/model';
import { BrandRepository, CategoryRepository, ProductRepository } from 'src/common/repository';
import { S3Service } from 'src/common/utils/service';
import { ProductResolver } from './product.resolver';

@Module({
  imports: [ProductModel, CategoryModel, BrandModel],
  controllers: [ProductController],
  providers: [ProductService, CategoryRepository, BrandRepository, ProductRepository, S3Service, ProductResolver]
})
export class ProductModule { }
