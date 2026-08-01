import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator"
import { CouponTypeEnum } from 'src/common/enum';

@ValidatorConstraint({ async: false, name: "CouponDiscount" })
export class CouponDiscount implements ValidatorConstraintInterface {

    validate(value: number, args: ValidationArguments) {
        if (args.object['type'] as CouponTypeEnum == CouponTypeEnum.PERCENTAGE && value > 100) {
            return false
        }
        return true
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return `we cannot accept ${validationArguments?.property} to be exceed 100%`
    }
}

export function IsValidDiscount(constraints: string[] = [], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints,
            validator: CouponDiscount,
        });
    };
}

@ValidatorConstraint({ async: false, name: "DateGreaterThanNow" })
export class DateGreaterThanNow implements ValidatorConstraintInterface {
    validate(value: Date, args: ValidationArguments) {

        return new Date(value).getTime() > Date.now()
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return `we cannot accept ${validationArguments?.property} to be lower than now`
    }
}

export function IsDateGtNow(constraints: string[] = [], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints,
            validator: DateGreaterThanNow,
        });
    };
}

@ValidatorConstraint({ async: false, name: "DateRange" })
export class DateRange implements ValidatorConstraintInterface {
    validate(value: Date, args: ValidationArguments) {

        return new Date(value).getTime() > new Date(args.object[args.constraints[0]]).getTime()
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return `we cannot accept ${validationArguments?.property} to be lower than ${validationArguments?.constraints[0]}`
    }
}

export function IsDateGte(constraints: string[] = [], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints,
            validator: DateRange,
        });
    };
}