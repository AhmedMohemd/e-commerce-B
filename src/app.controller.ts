import { Controller, Get, Inject, Req, Res, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { S3Service } from './common/utils/service';
import type { Request, Response } from 'express';
import { Cache, CACHE_MANAGER, CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CustomCacheInterceptor } from './common/interceptor/cache.interceptor';
import { ttl } from './common/decorator';

const s3WriteStream = promisify(pipeline);

@Controller()
export class AppController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly s3Service: S3Service,
    private readonly appService: AppService
  ) { }
  // @CacheTTL(25000)
  // @UseInterceptors(CacheInterceptor)
  @ttl(30)
  @UseInterceptors(CustomCacheInterceptor)
  @Get()
  async getHello() {
    // let data = await this.cacheManager.get("lol")
    // if (data) {
    //   return data
    // }
    // data = Date.now()
    // await this.cacheManager.set("lol", data, 15000)

    // console.log("IN");
    const data = Date.now()
    return data;
  }

  @Get("uploads/*path")
  async getFile(@Req() req: Request, @Res() res: Response) {
    const { download, fileName } = req.query as { download?: string, fileName?: string }
    const { path } = req.params as { path: string[] }
    const Key = path.join("/")
    const { Body, ContentType } = await this.s3Service.getAsset({ Key })
    res.setHeader(
      "Content-Type",
      ContentType || "application/octet-stream"
    );
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    if (download === "true") {
      res.setHeader("Content-Disposition", `attachment; filename="${fileName || path.pop()}"`);
    }

    return await s3WriteStream(Body as NodeJS.ReadableStream, res)
  }

  @Get("pre-signed/*path")
  async getFileLink(@Req() req: Request) {
    const { download, fileName } = req.query as { download?: string, fileName?: string }
    const { path } = req.params as { path: string[] }
    const Key = path.join("/")

    return await this.s3Service.createPreSignedFetchLink({ Key, download, fileName })
  }
}
