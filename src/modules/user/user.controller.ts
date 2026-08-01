import { Controller, Get, MaxFileSizeValidator, ParseFilePipe, Patch, Req, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import type { IUser, IFile } from "src/common/interfaces";
import { RoleEnum } from "src/common/enum";
import { Auth, User } from "src/common/decorator";
import { type HUserDocument } from "src/model";
import { type Request } from "express";
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { fileFieldValidation, cloudMulter } from "src/common/utils/multer";
@Controller("user")
export class UserController {

  constructor(
    private readonly userService: UserService
  ) { }

  // @Token(TokenTypeEnum.ACCESS)
  // @Role([RoleEnum.USER])
  // @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Auth([RoleEnum.USER])
  @Get()
  profile(
    @Req() req: Request,
    @User() user: HUserDocument
  ): IUser {
    // const user = this.userService.profile()
    // return { message: "Done", data: { user } }
    return user
  }
  @UseInterceptors(FileInterceptor("attachment", cloudMulter({ validation: fileFieldValidation.image })))
  // @UseInterceptors(FileInterceptor("attachment", cloudMulter({ validation: fileFieldValidation.image, folder: "User" })))
  @Auth([RoleEnum.USER])
  @Patch("profile-image")
  async profileImage(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true, validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })] })) file: IFile,
    @Req() req: Request,
    @User() user: HUserDocument): Promise<IUser> {
    return await this.userService.profileImage(file, user)
  }
  @UseInterceptors(FilesInterceptor("attachments", 3, cloudMulter({ validation: fileFieldValidation.image })))
  // @UseInterceptors(FilesInterceptor("attachments", 3, cloudMulter({ validation: fileFieldValidation.image, folder: "User" })))
  @Auth([RoleEnum.USER])
  @Patch("profile-cover-image")
  profileCoverImage(
    @UploadedFiles(new ParseFilePipe({ fileIsRequired: true, validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })] })) files: Array<IFile>,
    @Req() req: Request,
    @User() user: HUserDocument): any {
    return files
  }
  @UseInterceptors(FileFieldsInterceptor([{ name: "profile", maxCount: 1 }, { name: "cover", maxCount: 3 }], cloudMulter({ validation: fileFieldValidation.image })))
  // @UseInterceptors(FileFieldsInterceptor([{ name: "profile", maxCount: 1 }, { name: "cover", maxCount: 3 }], cloudMulter({ validation: fileFieldValidation.image, folder: "User" })))
  @Auth([RoleEnum.USER])
  @Patch("uploads")
  uploads(
    @UploadedFiles(new ParseFilePipe({ fileIsRequired: true })) files: { profile: Array<IFile>, cover: Array<IFile> },
    @Req() req: Request,
    @User() user: HUserDocument): any {
    return files
  }
}