import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ICoupon, IFile } from 'src/common/interfaces';
import type { HUserDocument } from 'src/model';
import { CouponRepository } from '../../common/repository/coupon.repository';
import { S3Service } from 'src/common/utils/service';

@Injectable()
export class CouponService {
  constructor(
    private readonly  couponRepository:CouponRepository,
    private readonly s3Service:S3Service
  ) { }
  async create({ discount, duration, endDate, name, startDate, type }: CreateCouponDto, user: HUserDocument, file: IFile): Promise<ICoupon> {
    const checkDuplicated = await this.couponRepository.findOne({ filter: { name, paranoid: false } });
    if (checkDuplicated) throw new ConflictException("Brand already exist");

    const image = await this.s3Service.uploadAsset({
      file, path: `Coupons`
    })

    const coupon = await this.couponRepository.createOne({
      data: {
        image,
        createdBy: user._id,
        name, startDate, endDate, type, discount, duration
      }
    })
    if (!coupon) {
      await this.s3Service.deleteAsset({ Key: image })
      throw new BadRequestException("Fail to generate this coupon instance")
    }
    return coupon.toJSON()
  }

  findAll() {
    return `This action returns all coupon`;
  }

  findOne(id: number) {
    return `This action returns a #${id} coupon`;
  }

  update(id: number, updateCouponDto: UpdateCouponDto) {
    return `This action updates a #${id} coupon`;
  }

  remove(id: number) {
    return `This action removes a #${id} coupon`;
  }
}
