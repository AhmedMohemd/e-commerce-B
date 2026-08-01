import { CompleteMultipartUploadCommandOutput, DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, DeleteObjectsCommandOutput, GetObjectCommand, GetObjectCommandOutput, ListObjectsV2Command, ListObjectsV2CommandOutput, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { StorageApproachEnum, UploadApproachEnum } from "src/common/enum";

@Injectable()
export class S3Service {

  private APPLICATION_NAME: string;
  private AWS_ACCESS_KEY_ID: string;
  private AWS_BUCKET_NAME: string;
  private AWS_EXPIRES_IN: number;
  private AWS_REGION: string;
  private AWS_SECRET_ACCESS_KEY: string;
  private client: S3Client
  constructor(private configService: ConfigService) {
    this.APPLICATION_NAME = this.configService.get<string>("APPLICATION_NAME") as string
    this.AWS_ACCESS_KEY_ID = this.configService.get<string>("AWS_ACCESS_KEY_ID") as string
    this.AWS_BUCKET_NAME = this.configService.get<string>("AWS_BUCKET_NAME") as string
    this.AWS_EXPIRES_IN = Number(this.configService.get<string>("AWS_EXPIRES_IN"))
    this.AWS_REGION = this.configService.get<string>("AWS_REGION") as string
    this.AWS_SECRET_ACCESS_KEY = this.configService.get<string>("AWS_SECRET_ACCESS_KEY") as string
    this.client = new S3Client({
      region: this.AWS_REGION,
      credentials: {
        accessKeyId: this.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.AWS_SECRET_ACCESS_KEY
      }
    })
  }
  async uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket = this.AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
    path = "general",
    file,
    ContentType
  }: {
    storageApproach?: StorageApproachEnum,
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File,
    ContentType?: string | undefined
  }): Promise<string> {

    const command = new PutObjectCommand({
      Bucket,
      ACL,
      Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
      Body: storageApproach === StorageApproachEnum.MEMORY ? file.buffer : createReadStream(file.path),
      ContentType: file.mimetype || ContentType
    })

    console.log(command);
    if (!command.input.Key) {
      throw new BadRequestException("Fail to upload this asset")
    }
    await this.client.send(command)
    return command.input.Key
  }


  async uploadLargeAsset({
    storageApproach = StorageApproachEnum.DISK,
    Bucket = this.AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
    path = "general",
    file,
    ContentType,
    parSize = 5
  }: {
    storageApproach?: StorageApproachEnum,
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File,
    ContentType?: string | undefined,
    parSize?: number | undefined
  }): Promise<CompleteMultipartUploadCommandOutput> {

    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        ACL,
        Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
        Body: storageApproach === StorageApproachEnum.MEMORY ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype || ContentType
      },
      partSize: parSize * 1024 * 1024
    })

    uploadFile.on("httpUploadProgress", (progress) => {
      console.log(progress);
      console.log(`Upload file is ${((progress.loaded as number) / (progress.total as number)) * 100} % `);
    })
    return await uploadFile.done()
  }

  async uploadAssets({
    storageApproach = StorageApproachEnum.MEMORY,
    uploadApproach = UploadApproachEnum.SMALL,
    Bucket = this.AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
    path = "general",
    files,
    ContentType,
    parSize
  }: {
    storageApproach?: StorageApproachEnum,
    uploadApproach?: UploadApproachEnum,
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    files: Express.Multer.File[],
    ContentType?: string | undefined,
    parSize?: number
  }): Promise<string[]> {
    let urls: string[] = []
    if (uploadApproach === UploadApproachEnum.SMALL) {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadAsset({ Bucket, path, ACL, ContentType, storageApproach, file })
        })
      )
    } else {
      const data = await Promise.all(
        files.map((file) => {
          return this.uploadLargeAsset({ Bucket, path, ACL, ContentType, storageApproach, file, parSize })
        })
      )
      urls = data.map(ele => ele.Key as string)
    }
    return urls
  }

  async createPreSignedUploadLink({
    Bucket = this.AWS_BUCKET_NAME,
    path = "general",
    Originalname,
    ContentType,
    expiresIn = this.AWS_EXPIRES_IN
  }: {
    Bucket?: string,
    path?: string,
    Originalname: string,
    ContentType: string,
    expiresIn?: number
  }): Promise<{ Key: string, url: string }> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${Originalname}`,
      ContentType
    })

    if (!command.input.Key) {
      throw new BadRequestException("Fail to upload this asset")
    }
    const url = await getSignedUrl(this.client, command, { expiresIn })
    return { url, Key: command.input.Key }

  }
  async getAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key
  }: {
    Bucket?: string,
    Key: string
  }): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket,
      Key
    })
    return await this.client.send(command)
  }
  async createPreSignedFetchLink({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
    expiresIn = this.AWS_EXPIRES_IN,
    download, fileName
  }: {
    Bucket?: string,
    Key: string,
    expiresIn?: number,
    download?: string | undefined,
    fileName?: string | undefined
  }): Promise<string> {

    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition: download === "true" ? `attachment; filename="${fileName || Key.split("/").pop()}"` : undefined,
    })

    const url = await getSignedUrl(this.client, command, { expiresIn })
    return url
  }

  async deleteAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key
  }: {
    Bucket?: string,
    Key: string
  }): Promise<DeleteObjectCommandOutput> {

    const command = new DeleteObjectCommand({
      Bucket,
      Key
    })

    return await this.client.send(command)
  }
  async deleteAssets({
    Bucket = this.AWS_BUCKET_NAME,
    Keys,
    Quiet = false
  }: {
    Bucket?: string,
    Keys: { Key: string }[],
    Quiet?: boolean
  }): Promise<DeleteObjectsCommandOutput> {

    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: Keys,
        Quiet
      }
    })

    return await this.client.send(command)
  }
  async listFolderDir({
    Bucket = this.AWS_BUCKET_NAME,
    prefix
  }: {
    Bucket?: string,
    prefix: string
  }): Promise<ListObjectsV2CommandOutput> {

    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${this.APPLICATION_NAME}/${prefix}`
    })

    return await this.client.send(command)
  }
  async deleteFolderByPrefix({
    Bucket = this.AWS_BUCKET_NAME,
    prefix
  }: {
    Bucket?: string,
    prefix: string
  }): Promise<DeleteObjectsCommandOutput> {

    const result = await this.listFolderDir({ Bucket, prefix });
    const Keys = result.Contents?.map(ele => { return { Key: ele.Key as string } }) as { Key: string }[]
    return await this.deleteAssets({ Bucket, Keys })
  }
}