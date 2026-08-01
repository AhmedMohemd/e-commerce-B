import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { HUserDocument } from 'src/model';
import { CxtType, IAuthReq, IAuthSocket } from '../interfaces';
import { GqlExecutionContext } from '@nestjs/graphql';

export const User = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        let user!: HUserDocument;
        switch (context.getType<CxtType>()) {
            case "http":
                user = (context.switchToHttp().getRequest() as IAuthReq).credentials.user
                break;
            case "graphql":
                    user = (GqlExecutionContext.create(context).getContext().req as IAuthReq).credentials.user
                break;
                  case "ws":
                    user = (context.switchToWs().getClient() as IAuthSocket).credentials.user
                    break;
            // case "ws":
            //   req = context.switchToWs().getClient()
            //   authorization = req.headers['authorization'] as string
            //   break;
            default:
                break;
        }
        return user
    },
);