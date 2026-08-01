import { Inject, Injectable } from "@nestjs/common";
import type { RedisClientType } from "redis";
import { EmailEnum } from "../../enum";
import { Types } from "mongoose";

type KeyType = { email: string, subject?: EmailEnum }

@Injectable()
export class CacheService {

    constructor(
        @Inject("REDIS_CLIENT") private readonly client: RedisClientType
    ) {
        this.handelEvents()
    }

    getCacheKey(value: string, userId?: string) {
        return userId ? `REQUEST::${value}::${userId}` : `REQUEST::${value}`
    }
    private handelEvents() {
        this.client.on("error", (error) => {
            console.log(`REDIS ERROR ,,, ${error}`);
        })
        this.client.on("ready", () => {
            console.log(`REDIS IS READY 💗`);
        })
    }

    public async connect() {
        await this.client.connect();
        console.log(`REDIS IS CONNECTED 👌`);
    }

    otpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: KeyType): string => {
        return `OTP::User::${email}::${subject}`
    }

    maxAttemptOtpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: KeyType): string => {
        return `${this.otpKey({ email, subject })}::MaxTrial`
    }

    blockOtpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: KeyType): string => {
        return `${this.otpKey({ email, subject })}::Block`
    }

    baseRevokeTokenKey = (userId: Types.ObjectId | string): string => {
        return `RevokeToken::${userId.toString()}`
    }

    revokeTokenKey = ({ userId, jti }: { userId: Types.ObjectId | string, jti: string }): string => {
        return `${this.baseRevokeTokenKey(userId)}::${jti}`
    }
    set = async ({
        key,
        value,
        ttl
    }: {
        key: string,
        value: any,
        ttl?: number | undefined
    }): Promise<string | null> => {
        try {
            let data = typeof value === 'string' ? value : JSON.stringify(value)
            return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data)
        } catch (error) {
            console.log(`Fail in redis set operation ${error}`);
            return null;
        }
    }

    update = async ({
        key,
        value,
        ttl
    }: {
        key: string,
        value: any,
        ttl?: number | undefined
    }): Promise<string | number | null> => {
        try {
            if (!await this.client.exists(key)) return 0;
            return await this.set({ key, value, ttl })
        } catch (error) {
            console.log(`Fail in redis update operation ${error}`);
            return null
        }
    }
    get = async (key: string): Promise<any> => {
        try {
            try {
                return JSON.parse(await this.client.get(key) as string)
            } catch (error) {
                return await this.client.get(key)
            }
        } catch (error) {
            console.log(`Fail in redis set operation ${error}`);
            return null
        }
    }

    ttl = async (key: string): Promise<number> => {
        try {
            return await this.client.ttl(key)
        } catch (error) {
            console.log(`Fail in redis ttl operation ${error}`);
            return -2
        }
    }
    exists = async (key: string): Promise<number> => {
        try {
            return await this.client.exists(key)
        } catch (error) {
            console.log(`Fail in redis exists operation ${error}`);
            return -2
        }
    }

    incr = async (key: string): Promise<number> => {
        try {
            return await this.client.incr(key)
        } catch (error) {
            console.log(`Fail in redis incr operation ${error}`);
            return -2
        }
    }

    expire = async ({ key, ttl }: { key: string, ttl: number }): Promise<number> => {
        try {
            return await this.client.expire(key, ttl)
        } catch (error) {
            console.log(`Fail in redis add-expire operation ${error}`);
            return -2
        }
    }
    mGet = async (keys: string[]): Promise<(string | null)[] | number> => {
        try {
            if (!keys.length) return 0;
            return await this.client.mGet(keys)
        } catch (error) {
            console.log(`Fail in redis mGet operation ${error}`);
            return 0
        }
    }

    keys = async (prefix: string): Promise<string[]> => {
        try {
            return await this.client.keys(`${prefix}*`)
        } catch (error) {
            console.log(`Fail in redis keys operation ${error}`);
            return []
        }
    }
    deleteKey = async (key: string | string[]): Promise<number> => {
        try {
            if (!key.length) return 0;
            return await this.client.del(key)
        } catch (error) {
            console.log(`Fail in redis dell operation ${error}`);
            return 0
        }
    }

    FCM_key(userId: Types.ObjectId | string) {
        return `user:FCM:${userId.toString()}`;
    }

    async addFCM(userId: Types.ObjectId | string, FCMToken: string) {
        return await this.client.sAdd(this.FCM_key(userId), FCMToken);
    }

    async removeFCM(userId: Types.ObjectId | string, FCMToken: string) {
        return await this.client.sRem(this.FCM_key(userId), FCMToken);
    }

    async getFCMs(userId: Types.ObjectId | string) {
        return await this.client.sMembers(this.FCM_key(userId));
    }
    async hasFCMs(userId: Types.ObjectId | string) {
        return await this.client.sCard(this.FCM_key(userId));
    }

    async removeFCMUser(userId: Types.ObjectId | string) {
        return await this.client.del(this.FCM_key(userId));
    }

    socketKey(userId: Types.ObjectId | string) {
        return `user:sockets:${userId.toString()}`;
    }

    async addSocket(userId: Types.ObjectId | string, socketId: string) {
        return await this.client.sAdd(this.socketKey(userId), socketId);
    }

    async removeSocket(userId: Types.ObjectId | string, socketId: string) {
        return await this.client.sRem(this.socketKey(userId), socketId);
    }

    async getSockets(userId: Types.ObjectId | string) {
        return await this.client.sMembers(this.socketKey(userId));
    }

    async hasSockets(userId: Types.ObjectId | string) {
        return await this.client.sCard(this.socketKey(userId));
    }

    async removeUser(userId: Types.ObjectId | string) {
        return await this.client.del(this.socketKey(userId));
    }
}