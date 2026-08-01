import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateProductParamsDto } from './dto/update-product.dto';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { IFile, IPaginate, IProduct } from 'src/common/interfaces';
import type { HUserDocument } from 'src/model';
import { CustomCacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { PaginatedDto } from 'src/common/dto/paginate.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @UseInterceptors(
    FileFieldsInterceptor([{ name: "image", maxCount: 1 }, { name: "gallery", maxCount: 3 }], cloudMulter({ validation: fileFieldValidation.image })
    ),
  )
  @Auth([RoleEnum.ADMIN])
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @User() user: HUserDocument,
    @UploadedFiles() files: { image: IFile[], gallery?: IFile[] }
  ) {
    return await this.productService.create(createProductDto, user, files);
  }


  @UseInterceptors(FileFieldsInterceptor([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 3 }],
    cloudMulter({ validation: fileFieldValidation.image })
  ))
  @Auth([RoleEnum.ADMIN])
  @Patch(':productId')
  update(
    @Param() params: UpdateProductParamsDto,
    @Body() updateProductDto: UpdateProductDto,
    @User() user: HUserDocument,
    @UploadedFiles() files?: { image?: IFile[], gallery?: IFile[] }
  ) {
    return this.productService.update(params, updateProductDto, user, files);
  }

  @UseInterceptors(CustomCacheInterceptor)
  @Get()
  async findAll(@Query() query: PaginatedDto): Promise<IPaginate<IProduct>> {
    return await this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }


  @Auth([RoleEnum.ADMIN])
  @Delete(':productId')
  async remove(
    @Param() params: UpdateProductParamsDto,
    @User() user: HUserDocument
  ) {
    return await this.productService.remove(params, user);
  }
}
