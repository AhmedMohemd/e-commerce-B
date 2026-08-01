
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword, Matches, MaxLength, MinLength, ValidateIf} from "class-validator";
import { IsMatch } from "src/common/decorator";
export class ResendConfirmEmailDto {
    @IsEmail({}, { message: "Email is required" })
    email!: string;
}

export class ConfirmEmailDto extends ResendConfirmEmailDto {
    @Matches(/^\d{6}$/)
    otp!: string;
}

export class LoginDto extends ResendConfirmEmailDto {


    @IsStrongPassword({ minNumbers: 3, minUppercase: 1, minLowercase: 1, minSymbols: 1 })
    password!: string;

    @IsOptional()
    @IsString()
    FCM?: string;

}
export class SignupDto extends LoginDto {
    @MaxLength(55)
    @MinLength(2)
    @IsNotEmpty()
    username!: string;
    @IsOptional()
    @IsString()
    phone?: string;
    @ValidateIf((data: any) => {
        // console.log({ data });
        // if (data.password != data.confirmPassword) {
        //     throw new BadRequestException("Passwords do not match")
        // }
        return Boolean(data.password)
    })
    @IsMatch(['password'])
    confirmPassword!: string;
}
export class SignupWithGmailDto {
    @IsString()
    @IsNotEmpty()
    idToken!: string;
}
