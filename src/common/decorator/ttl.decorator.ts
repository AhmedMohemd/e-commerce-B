import { SetMetadata } from "@nestjs/common"

export const ttlName = "ttlName";
export const ttl = (value: number = 10) => {
    return SetMetadata(ttlName, value)
}

