import { Body, Controller, HttpCode, HttpStatus, Patch, Post, Req, Res, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { ConfirmEmailDto, LoginDto, ResendConfirmEmailDto, SignupDto, SignupWithGmailDto } from "./dto/authentication.dto";
import type { Request , Response } from "express";
import type{ IUser } from "src/common/interfaces";
import { LoginResponse } from "./entites/authentication.entity";
@UsePipes(new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
}))
@Controller("auth")
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService
    ) { }

    @Post("signup")
    async signup(@Body() body: SignupDto):Promise<IUser> {
        console.log(body);
        // const user = await this.authenticationService.signup(body)
        // return { message: "Done", data: { user } }
        return await this.authenticationService.signup(body)
    }
    @Patch("confirm-email")
    async confirmEmail(@Body() body: ConfirmEmailDto): Promise<void>{
        await this.authenticationService.confirmEmail(body)
        return;
    }
    @Patch("resend-confirm-email")
    async resendConfirmEmail(@Body() body: ResendConfirmEmailDto): Promise<void> {
        await this.authenticationService.resendConfirmEmail(body)
        return;
    }
    @HttpCode(HttpStatus.OK)
    @Post("login")
    async login(
        @Req() req: Request,
        @Body() body: LoginDto
    ): Promise<LoginResponse> {
        // const credentials = await this.authenticationService.login(body, `${req.protocol}://${req.host}`)
        // return { message: "Done", data: credentials }
        return await this.authenticationService.login(body, `${req.protocol}://${req.host}`)
    }
    @Post("signup/gmail")
    async signupWithGmail(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body() body: SignupWithGmailDto): Promise<LoginResponse>{
        console.log(body);
        const { status, credentials } = await this.authenticationService.signupWithGmail(body.idToken, `${req.protocol}://${req.host}`)
        res.status(status)
        // return { message: "Done", data: credentials }
        return credentials
    }
}
