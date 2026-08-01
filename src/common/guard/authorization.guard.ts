import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { CxtType, IAuthReq, IAuthSocket } from '../interfaces';
import { Reflector } from '@nestjs/core';
import { RoleEnum, TokenTypeEnum } from '../enum';
import { roleName } from '../decorator';
import { HUserDocument } from 'src/model';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    // console.log(context);
    // console.log({ type: context.getType(), getHandler: context.getHandler(), class: context.getClass() });
    const roles = this.reflector.getAllAndOverride<RoleEnum[]>(roleName, [context.getHandler(), context.getClass()]) ?? TokenTypeEnum.ACCESS

    let user!: HUserDocument;
    switch (context.getType<CxtType>()) {
      case "http":
        user = (context.switchToHttp().getRequest() as IAuthReq).credentials.user
        break;
      case "graphql":
        user = (GqlExecutionContext.create(context).getContext().req as IAuthReq).credentials?.user;
      case "ws":
        user = (context.switchToWs().getClient() as IAuthSocket).credentials.user
        break;
      default:
        break;
    }

    if (!user) {
      return false
    }
    return roles.includes(user.role);
  }
}