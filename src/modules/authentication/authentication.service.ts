import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfirmEmailDto, LoginDto, ResendConfirmEmailDto, SignupDto } from "./dto/authentication.dto";
import { IUser } from "src/common/interfaces";
import { UserRepository } from "src/common/repository";
import { EmailService, CacheService, TokenService } from "src/common/utils/service";
import { EmailEnum, ProviderEnum } from "src/common/enum";
import { createNumberOtp } from "src/common/utils/otp";
import { SecurityService } from "src/common/module/security/security.service";
import { emailEvent } from "src/common/event";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { LoginResponse } from "./entites/authentication.entity";
// import { SecurityService } from "src/common/module";

@Injectable()
export class AuthenticationService {
    constructor(

        private readonly configService: ConfigService,
        private readonly tokenService: TokenService,
        private readonly securityService: SecurityService,
        private readonly emailService: EmailService,
        private readonly redis: CacheService,
        private readonly userRepository: UserRepository
    ) { }

    private async sendEmailOtp({
        email,
        subject,
        title,
    }: {
        email: string;
        subject: EmailEnum;
        title: string;
    }) :Promise<void>{
        const isBlockedTTL = await this.redis.ttl(
            this.redis.blockOtpKey({ email, subject }),
        );
        if (isBlockedTTL > 0) {
            throw new BadRequestException(
                `Sorry we cannot request new otp while are blocked please try again after ${isBlockedTTL}`,
            );
        }
        const remainingOtpTTL = await this.redis.ttl(
            this.redis.otpKey({ email, subject }),
        );
        if (remainingOtpTTL > 0) {
            throw new BadRequestException(
                `Sorry we cannot request new otp while current otp still active please try again after ${remainingOtpTTL}`,
            );
        }
        const maxTrial = await this.redis.get(
            this.redis.maxAttemptOtpKey({ email, subject }),
        );
        if (maxTrial >= 3) {
            await this.redis.set({
                key: this.redis.blockOtpKey({ email, subject }),
                value: 1,
                ttl: 7 * 60,
            });
            throw new BadRequestException(`you have reached the max trial`);
        }
        const code = createNumberOtp();
        await this.redis.set({
            key: this.redis.otpKey({ email, subject }),
            value: await this.securityService.generateHash({ plaintext: `${code}` }),
            ttl: 120,
        });
        emailEvent.emit("sendEmail", async () => {
            await this.emailService.sendEmail({
                to: email,
                subject,
                html: this.emailService.emailTemplate({ code, title }),
            });
            await this.redis.incr(this.redis.maxAttemptOtpKey({ email, subject }));
        });
    }
    async signup({ email, username, password, phone }: SignupDto): Promise<IUser> {

        const checkUserExist = await this.userRepository.findOne({ filter: { email }, projection: "email", options: { lean: false } })
        if (checkUserExist) {
            console.log({ checkUserExist });
            checkUserExist._id

            throw new ConflictException("Email exist")
        }
        const user = await this.userRepository.createOne({
            data: {
                email,
                username,
                password,
                phone: phone as string
            },
            options: {}
        })
        if (!user) {
            throw new BadRequestException("Fail")
        }
        this.sendEmailOtp({ email, subject: EmailEnum.CONFIRM_EMAIL, title: "Verify Email" })
        return user.toJSON()
    }
    async confirmEmail({ email, otp }: ConfirmEmailDto): Promise<void>{

        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: EmailEnum.CONFIRM_EMAIL }))
        if (!hashOtp) {
            throw new NotFoundException("Expired otp")
        }

        const account = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.SYSTEM }
        })
        if (!account) {
            throw new NotFoundException("Fail to find matching account")
        }
        if (!await this.securityService.compareHash({ plaintext: otp, cipherText: hashOtp })) {
            throw new ConflictException("Invalid otp")
        }
        account.confirmEmail = new Date();
        await account.save()
        await this.redis.deleteKey(await this.redis.keys(this.redis.otpKey({ email })))

        return;
    }
    async resendConfirmEmail({ email }: ResendConfirmEmailDto): Promise<void> {

        const account = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.SYSTEM }
        })
        if (!account) {
            throw new NotFoundException("Fail to find matching account")
        }

        await this.sendEmailOtp({ email, subject: EmailEnum.CONFIRM_EMAIL, title: "Verify Email" })

        return;
    }
    async login({ email, password, FCM }: LoginDto, issuer: string): Promise<LoginResponse> {

        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true }
            },

        });
        if (!user) {
            throw new NotFoundException('Invalid login credentials')
        }

        if (!await this.securityService.compareHash({ plaintext: password, cipherText: user.password })) {
            throw new NotFoundException('Invalid login credentials')
        }
        return await this.tokenService.createLoginCredentials(user, issuer)
    }
    private async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: this.configService.get("CLIENT_ID"),
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new BadRequestException("Invalid token payload")
        }
        return payload
    }
    async loginWithGmail(idToken: string, issuer: string): Promise<LoginResponse>{

        const payload = await this.verifyGoogleAccount(idToken)

        const user = await this.userRepository.findOne({
            filter: {
                email: payload.email as string,
                provider: ProviderEnum.GOOGLE
            }
        })
        if (!user) {
            throw new NotFoundException("Invalid account provider or not register account")
        }

        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async signupWithGmail(idToken: string, issuer: string): Promise<{status:number , credentials:LoginResponse}> {

        const payload = await this.verifyGoogleAccount(idToken)
        const checkExist = await this.userRepository.findOne({
            filter: {
                email: payload.email as string
            }
        })
        console.log({ checkExist });
        if (checkExist) {
            if (checkExist.provider != ProviderEnum.GOOGLE) {
                throw new ConflictException("Invalid account provider")
            }
            return { status: 200, credentials: await this.loginWithGmail(idToken, issuer) };
        }

        const account = await this.userRepository.createOne({
            data: {
                firstName: payload.given_name,
                lastName: payload.family_name,
                email: payload.email,
                profilePicture: payload.picture,
                confirmEmail: new Date(),
                provider: ProviderEnum.GOOGLE
            }
        })
        return { status: 201, credentials: await this.tokenService.createLoginCredentials(account, issuer) };
    }
}