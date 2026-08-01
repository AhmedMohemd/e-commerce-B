import { SetMetadata } from "@nestjs/common";

export const personalCacheName = "personalCacheName";
export const PersonalCache = (value: boolean = false) => {
    return SetMetadata(personalCacheName, value)
}