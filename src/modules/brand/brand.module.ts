import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandRepository, ProductRepository } from 'src/common/repository';
import { S3Service } from 'src/common/utils/service';
import { BrandModel, ProductModel } from 'src/model';

@Module({
  imports: [
    BrandModel,
    ProductModel
  ],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository, ProductRepository,S3Service],
})
export class BrandModule {}
