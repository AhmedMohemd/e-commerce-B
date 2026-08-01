import { Injectable } from "@nestjs/common";
import crypto from "node:crypto";
import { BadRequestException } from "@nestjs/common";
import { compare , hash } from "bcrypt";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class SecurityService {

    constructor(
        private readonly configService: ConfigService
    ) { }
    generateHash = async ({
        plaintext,
        salt = Number(this.configService.get<string>("SALT_ROUND") || 12)
    }: { plaintext: string, salt?: number }): Promise<string> => {

        return await hash(plaintext, salt)
    }


    compareHash = async ({
        plaintext,
        cipherText,
    }: { plaintext: string, cipherText: string }): Promise<boolean> => {
        return await compare(plaintext, cipherText)
    }

   generateEncryption = async (
      plaintext: string,
    ): Promise<string> => {
       const iv = crypto.randomBytes(Number(this.configService.get<string>("IV_LENGTH")));
      const ENC_SECRET_KEY = this.configService.get<string>("ENC_SECRET_KEY") as string;
       const cipherIvVector = crypto.createCipheriv(
        "aes-256-cbc",
        ENC_SECRET_KEY,
        iv,
      );
      let cipherText = cipherIvVector.update(plaintext, "utf-8", "hex");
      cipherText += cipherIvVector.final("hex");
      console.log({ iv, cipherIvVector, cipherText, ivv: iv.toString("hex") });
      return `${iv.toString("hex")}:${cipherText}`;
    };
   generateDecryption = async (
      cipherText: string,
   ): Promise<string> => {
       const ENC_SECRET_KEY = this.configService.get<string>("ENC_SECRET_KEY") as string;
      const [iv, encryption] = cipherText.split(":") || ([] as string[]);
      if (!iv || !encryption) {
        throw new BadRequestException("Invalid encryption parts");
      }
      const ivLikeBinary = Buffer.from(iv, "hex");
      console.log({ iv, ivLikeBinary, encryption });
      const deCipherIvVector = crypto.createDecipheriv(
        "aes-256-cbc",
        ENC_SECRET_KEY,
        ivLikeBinary,
      );
      let plaintext = deCipherIvVector.update(encryption, "hex", "utf-8");
      plaintext += deCipherIvVector.final("utf-8");
      return plaintext;
    };
}