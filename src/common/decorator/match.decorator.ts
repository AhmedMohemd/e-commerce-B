import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from "class-validator";

export class MatchBetweenFields<T = any> implements ValidatorConstraintInterface {
    validate(value: T, args: ValidationArguments) {

        return value == args.object[args.constraints[0]]
    }

    defaultMessage(args?: ValidationArguments): string {
        return `Fail to match between ${args?.property} and ${args?.constraints[0]}`;
    }
}

export function IsMatch<T = any>(constraints: string[] = [], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints,
            validator: MatchBetweenFields<T>,
        });
    };
}