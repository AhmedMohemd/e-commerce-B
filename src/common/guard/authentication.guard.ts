import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { TokenService } from '../utils/service';
import { CxtType, IAuthReq, IAuthSocket } from '../interfaces';
import { Reflector } from '@nestjs/core';
import { TokenTypeEnum } from '../enum';
import { tokenTypeName } from '../decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { getAuthSocket } from '../utils/socket';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(

    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) { }
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      // console.log(context);
      // console.log({ type: context.getType(), getHandler: context.getHandler(), class: context.getClass() });
      const tokenType = this.reflector.getAllAndOverride<TokenTypeEnum>(tokenTypeName, [context.getHandler(), context.getClass()]) ?? TokenTypeEnum.ACCESS

      // console.log({ tokenType });
      let req!: IAuthReq | IAuthSocket;
      let authorization!: string;
      switch (context.getType<CxtType>()) {
        case "http":
          req = context.switchToHttp().getRequest() as IAuthReq
          authorization = req.headers['authorization'] as string
          break;
        case "graphql":
          req = GqlExecutionContext.create(context).getContext().req as IAuthReq;
          console.log(req);

          authorization = req.headers['authorization'] as string

          break;
        case "ws":
          req = context.switchToWs().getClient() as IAuthSocket
          authorization = "Bearer " + getAuthSocket(req)
          break;

        default:
          break;
      }
      // console.log(context.getType());
      if (!authorization) {
        return false
      }
      const [key, credential] = authorization?.split(" ") || [];
      // console.log({ key, credential });
      if (!key || !credential) {
        throw new UnauthorizedException('Missing authorization')
      }
      switch (key) {
        case 'Basic':
          const [username, password] = Buffer.from(credential, 'base64').toString().split(":")
          console.log({ username, password });
          break;
        default:
          req.credentials = await this.tokenService.decodeToken({ token: credential, tokenType })

          break;
      }
      return true;
      
    } catch (error) {
      return false
      // throw new UnauthorizedException(error)
    }
  }
}