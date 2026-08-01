import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponModel } from 'src/model';
import { CouponRepository } from 'src/common/repository';
import { S3Service } from 'src/common/utils/service';

@Module({
  imports: [CouponModel],
  controllers: [CouponController],
  providers: [CouponService,CouponRepository,S3Service],
})
export class CouponModule {}
