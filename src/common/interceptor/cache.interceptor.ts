import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { CacheService } from "../utils/service";
import { Reflector } from "@nestjs/core";
import { Observable, of, tap } from "rxjs";
import { CxtType, IAuthReq } from "../interfaces";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
    constructor(private readonly redis: CacheService, private readonly reflector: Reflector) { }
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const ttl: number = this.reflector.getAllAndOverride<number>('ttlName', [context.getHandler(), context.getClass()]) ?? 10
        const usePersonalUser: boolean = this.reflector.getAllAndOverride<boolean>('personalCacheName', [context.getHandler(), context.getClass()]) ?? false
        // let url!: string;

        // switch (context.getType()) {
        //     case 'http':
        //         url = context.switchToHttp().getRequest().url
        //         break;
        //     default:
        //         break;
        // }
        // console.log({ url });
        // const cacheKey = this.redis.getCacheKey(url)
        let url!: string;
        let userId!: string;
        switch (context.getType<CxtType>()) {
            case 'http':
                const req: IAuthReq = context.switchToHttp().getRequest()
                url = context.switchToHttp().getRequest().url
                userId = req.credentials?.user?._id?.toString()
                break;
            case 'graphql':
                const ctx = GqlExecutionContext.create(context)
                url = JSON.stringify({
                    key: ctx.getInfo().path.key,
                    typename: ctx.getInfo().path.typename,
                    args: ctx.getArgs()
                })

                break;
            default:
                break;
        }
        const cacheKey = this.redis.getCacheKey(url, usePersonalUser ? userId : undefined)
        console.log({ cacheKey });
        const data = await this.redis.get(cacheKey)
        if (data) {
            return of(data)
        }
        return next
            .handle()
            .pipe(
                tap(async (value) => {
                    await this.redis.set({ key: cacheKey, value, ttl })
                }),
            );

    }
}