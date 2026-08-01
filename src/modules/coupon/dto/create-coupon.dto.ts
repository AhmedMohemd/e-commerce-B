import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min, MinLength } from "class-validator";
import { ICoupon } from "src/common/interfaces";
import { CouponTypeEnum } from 'src/common/enum';
import { IsDateGte, IsDateGtNow, IsValidDiscount } from "src/common/decorator";

export class CreateCouponDto implements Partial<ICoupon> {

   
    @MaxLength(5000)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    name!: string;
    @IsDateString()
    @IsDateGtNow()
    startDate!: Date;
    @IsDateString()
    @IsDateGte(['startDate'])
    endDate!: Date;
    @Transform(({ value }) => {
        console.log(value);

        return Number(value)
    })
    @Min(1)
    @IsInt()
    duration!: number;
    @Transform(({ value }) => {
        console.log(value);

        return Number(value)
    })
    @IsEnum(CouponTypeEnum)
    type!: CouponTypeEnum;
    @Transform(({ value }) => {
        console.log(value);

        return Number(value)
    })
    @Min(1)
    @IsNumber()
    @IsValidDiscount()
    discount!: number;
}