import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import { IUser } from '../../interfaces'
import { HydratedDocument, Types } from 'mongoose'
import { randomUUID } from 'node:crypto'
import { CacheService } from './cache.service'
import { UserRepository } from '../../repository'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { RoleEnum, TokenTypeEnum } from 'src/common/enum'
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
@Injectable()
export class TokenService { 
    private ACCESS_TOKEN_EXPIRES_IN: number;
    private REFRESH_TOKEN_EXPIRES_IN: number;
    private ACCESS_SYSTEM_TOKEN_SIGNATURE: string;
    private REFRESH_SYSTEM_TOKEN_SIGNATURE: string;
    private ACCESS_USER_TOKEN_SIGNATURE: string;
    private REFRESH_USER_TOKEN_SIGNATURE: string
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly redis: CacheService,
        private readonly userRepository: UserRepository) {
        this.ACCESS_TOKEN_EXPIRES_IN = Number(this.configService.get("ACCESS_TOKEN_EXPIRES_IN"))
        this.REFRESH_TOKEN_EXPIRES_IN = Number(this.configService.get("REFRESH_TOKEN_EXPIRES_IN"))
        this.ACCESS_SYSTEM_TOKEN_SIGNATURE = this.configService.get("ACCESS_SYSTEM_TOKEN_SIGNATURE") as string
        this.REFRESH_SYSTEM_TOKEN_SIGNATURE = this.configService.get("REFRESH_SYSTEM_TOKEN_SIGNATURE") as string
        this.ACCESS_USER_TOKEN_SIGNATURE = this.configService.get("ACCESS_USER_TOKEN_SIGNATURE") as string
        this.REFRESH_USER_TOKEN_SIGNATURE = this.configService.get("REFRESH_USER_TOKEN_SIGNATURE") as string
    }
    async sign({ payload, secret = this.ACCESS_USER_TOKEN_SIGNATURE, options }: {
        payload: object,
        secret?: string,
        options?: SignOptions,
    }): Promise<string> {
        return await this.jwtService.signAsync(payload, { secret, ...options })
    }
     
    async verify({ token, secret = this.ACCESS_USER_TOKEN_SIGNATURE }: {
        token: string,
        secret?: string,
    }): Promise<JwtPayload> {
        return this.jwtService.verifyAsync(token, { secret }) as JwtPayload
    }

    detectSignatureLevel = async (role: RoleEnum): Promise<{
        accessSignature: string;
        refreshSignature: string;
    }> => {
        let signatures: {
            accessSignature: string;
            refreshSignature: string;
        }
        switch (role) {
            case RoleEnum.ADMIN:
                signatures = {
                    accessSignature: this.ACCESS_SYSTEM_TOKEN_SIGNATURE,
                    refreshSignature: this.REFRESH_SYSTEM_TOKEN_SIGNATURE,
                }
                break;
            default:
                signatures = {
                    accessSignature: this.ACCESS_USER_TOKEN_SIGNATURE,
                    refreshSignature: this.REFRESH_USER_TOKEN_SIGNATURE,
                }
                break;
        }

        return signatures
    }
    getSignature = async (tokenType = TokenTypeEnum.ACCESS, signatureLevel: RoleEnum): Promise<string> => {

        const signatures = await this.detectSignatureLevel(signatureLevel)
        let signature: string;
        switch (tokenType) {
            case TokenTypeEnum.REFRESH:
                signature = signatures.refreshSignature
                break;
            default:
                signature = signatures.accessSignature
                break;
        }
        return signature
    }
    decodeToken = async ({ token, tokenType = TokenTypeEnum.ACCESS }: { token: string, tokenType?: TokenTypeEnum }): Promise<{
        user: HydratedDocument<IUser>,
        decoded: JwtPayload
    }> => {
        const decoded = jwt.decode(token) as JwtPayload;

        if (!decoded?.aud?.length) {
            throw new BadRequestException("Missing token audience")
        }

        const [tokenApproach, signatureLevel] = decoded.aud;
        if (tokenType !== tokenApproach as unknown as TokenTypeEnum) {
            throw new BadRequestException(`Invalid token approach only ${tokenType} allowed for this endpoint`)
        }

        if (decoded.jti && await this.redis.get(this.redis.revokeTokenKey({ userId: decoded.sub as string, jti: decoded.jti }))) {
            throw new UnauthorizedException("Invalid login session")
        }
        const secret = await this.getSignature(tokenApproach as unknown as TokenTypeEnum, signatureLevel as unknown as RoleEnum);
        const verifiedData = await this.verify({ token, secret })
        if (!verifiedData?.sub) {
            throw new BadRequestException("Invalid token payload")
        }
        const user = await this.userRepository.findOne({
            filter: {
                _id: verifiedData.sub
            }
        })
        if (!user) {
            throw new NotFoundException("Not register account")
        }
        if (user.changeCredentialsTime && user.changeCredentialsTime?.getTime() >= (decoded.iat as number || 0) * 1000) {
            throw new UnauthorizedException("Invalid login session")
        }

        return { user, decoded }

    }
  
    

    createLoginCredentials = async (user: HydratedDocument<IUser>, issuer: string): Promise<{ access_token: string, refresh_token: string }> => {
        const { accessSignature, refreshSignature } = await this.detectSignatureLevel(user.role);

        const jwtid = randomUUID()
        const access_token = await this.sign({
            payload: { sub: user._id },
            secret: accessSignature,
            options: {
                issuer,
                audience: [TokenTypeEnum.ACCESS as unknown as string, user.role as unknown as string],
                expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
                jwtid
            }
        })

        const refresh_token = await this.sign({
            payload: { sub: user._id },
            secret: refreshSignature,
            options: {
                issuer,
                audience: [TokenTypeEnum.REFRESH as unknown as string, user.role as unknown as string],
                expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
                jwtid
            }
        })
        return { access_token, refresh_token }
    }



    createRevokeToken = async ({ userId, jti, ttl }: { userId: Types.ObjectId | string, jti: string, ttl: number }) => {
        await this.redis.set({
            key: this.redis.revokeTokenKey({ userId, jti }),
            value: jti,
            ttl
        })
        return;
    }

}