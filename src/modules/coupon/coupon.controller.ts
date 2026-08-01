import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import type { HUserDocument } from 'src/model';
import { RoleEnum } from 'src/common/enum';
import { Auth, User } from 'src/common/decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import type { ICoupon, IFile } from 'src/common/interfaces';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) { }

  @Auth([RoleEnum.ADMIN])
  @UseInterceptors(FileInterceptor('attachment', cloudMulter({ validation: fileFieldValidation.image })))
  @Post()
  async create(
    @Body() createCouponDto: CreateCouponDto,
    @User() user: HUserDocument,
    @UploadedFile(ParseFilePipe) file: IFile
  ): Promise<ICoupon> {
    return this.couponService.create(createCouponDto, user, file);
  }
  @Get()
  findAll() {
    return this.couponService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(+id, updateCouponDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponService.remove(+id);
  }
}
