import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto, UpdateCategoryParamsDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import { RoleEnum } from 'src/common/enum';
import { Auth, User } from 'src/common/decorator';
import type { HUserDocument } from 'src/model';
import type { ICategory, IFile } from 'src/common/interfaces';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseInterceptors(FileInterceptor("attachment", cloudMulter({ validation: fileFieldValidation.image })))
  @Auth([RoleEnum.ADMIN])
  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @User() user: HUserDocument,
    @UploadedFile(ParseFilePipe) file: IFile
  ): Promise<ICategory> {
    return await this.categoryService.create(createCategoryDto, user, file);
  }

  @UseInterceptors(FileInterceptor("attachment", cloudMulter({ validation: fileFieldValidation.image })))
  @Auth([RoleEnum.ADMIN])
  @Patch(':categoryId')
  async update(
    @Param() params: UpdateCategoryParamsDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: HUserDocument,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file?: IFile
  ): Promise<ICategory> {
    return await this.categoryService.update(params, updateCategoryDto, user, file);
  }
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }


  @Auth([RoleEnum.ADMIN])
  @Delete(':categoryId')
  async remove(
    @Param() params: UpdateCategoryParamsDto,
    @User() user: HUserDocument
  ): Promise<ICategory> {
    return await this.categoryService.remove(params, user);
  }
}
