import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createClient } from "redis";
import { UserRepository } from "src/common/repository";
import { CacheService, TokenService } from "src/common/utils/service";
import { UserModel } from "src/model";
@Global()
@Module({
    imports: [UserModel],
    exports: ["REDIS_CLIENT",
        UserRepository,
        CacheService,
        JwtService,
        TokenService
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const client = createClient({
                    url: configService.get<string>("REDIS_URI"),
                });
                client.on('error', (err) => console.error('Redis Client Error ❌', err));
                await client.connect();
                console.log('Redis connected ✨');
                return client;
            },
            inject: [ConfigService]
        },
        UserRepository,
        CacheService,
        JwtService,
        TokenService
    ]
})
export class SharedAuthentcationModule { }