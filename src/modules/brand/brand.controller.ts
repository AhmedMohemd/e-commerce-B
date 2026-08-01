import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ParseFilePipe, UploadedFile } from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandParamsDto } from './dto/update-brand.dto';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import type { HUserDocument } from 'src/model';
import type { IBrand, IFile } from 'src/common/interfaces';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';

@Controller('brand')
export class BrandController {
  constructor(
    private readonly brandService: BrandService
  ) { }
  @UseInterceptors(FileInterceptor("attachment", cloudMulter({ validation: fileFieldValidation.image })))
  @Auth([RoleEnum.ADMIN])
  @Post()
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @User() user: HUserDocument,
    @UploadedFile(ParseFilePipe) file: IFile
  ):Promise<IBrand> {
    return await this.brandService.create(createBrandDto, user, file);
  }


  @UseInterceptors(FileInterceptor("attachment", cloudMulter({ validation: fileFieldValidation.image })))
  @Auth([RoleEnum.ADMIN])
  @Patch(':brandId')
 async update(
    @Param() params: UpdateBrandParamsDto,
    @Body() updateBrandDto: UpdateBrandDto,
    @User() user: HUserDocument,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file?: IFile
  ):Promise<IBrand> {
    return await this.brandService.update(params, updateBrandDto, user, file);
  }


  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(+id);
  }


  @Auth([RoleEnum.ADMIN])
  @Delete(':brandId')
  async remove(
    @Param() params: UpdateBrandParamsDto,
    @User() user: HUserDocument
  ): Promise<IBrand> {
    return await this.brandService.remove(params, user);
  }
}
