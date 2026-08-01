import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandParamsDto } from './dto/update-brand.dto';
import { S3Service } from 'src/common/utils/service';
import type{ HUserDocument } from 'src/model';
import type{ IBrand, IFile } from 'src/common/interfaces';
import { BrandRepository, ProductRepository } from 'src/common/repository';
import { toObjectId } from 'src/common/utils/object_Id';
import { generateSlug } from 'src/common/utils/slug';

@Injectable()
export class BrandService {
  constructor(
    private readonly s3Service:S3Service, 
    private readonly brandRepository: BrandRepository,
    private readonly productRepository: ProductRepository

  ) { }
  async create({ name }: CreateBrandDto, user: HUserDocument, file: IFile): Promise<IBrand> {
    const checkDuplicated = await this.brandRepository.findOne({ filter: { name, paranoid: false } });
    if (checkDuplicated) throw new ConflictException("Brand Already Exist");

    const image = await this.s3Service.uploadAsset({ file, path: `Brands` });
    const brand = await this.brandRepository.createOne({
      data: {
        name,
        image,
        createdBy: user._id
      }
    })
    if (!brand) {
      await this.s3Service.deleteAsset({ Key: image })
      throw new BadRequestException("Fail to create this brand instance")
    }
    return brand.toJSON()
  }


  async update({ brandId }: UpdateBrandParamsDto, { name }: UpdateBrandDto, user: HUserDocument, file?: IFile):Promise<IBrand> {
    brandId = toObjectId(brandId as string)
    const brand = await this.brandRepository.findOne({ filter: { _id: brandId } })
    if (!brand) throw new NotFoundException("Fail to find matching brand");

    if (name) {
      if (await this.brandRepository.findOne({ filter: { name, _id: { $ne: brandId }, paranoid: false } })) {
        throw new ConflictException("Brand with same name already exist")
      }
      brand.name = name;
      brand.slug = generateSlug(brand.name)
    }
    let oldImage!: string;
    if (file) {
      brand.image = await this.s3Service.uploadAsset({ file, path: "Brands" })
    }

    brand.updatedBy = user._id;
    await brand.save()
    if (oldImage) {
      await this.s3Service.deleteAsset({ Key: oldImage })
    }
    return brand.toJSON();
  }


  findAll() {
    return `This action returns all brand`;
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }


  async remove({ brandId }: UpdateBrandParamsDto, user: HUserDocument): Promise<IBrand> {
    brandId = toObjectId(brandId as string);

    const brand = await this.brandRepository.findOne({ filter: { _id: brandId } });
    if (!brand) throw new NotFoundException("Brand not exist");

    const deletedBrand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: { deletedAt: new Date(), updatedBy: user._id }
    });
    if (!deletedBrand) throw new BadRequestException("Fail to delete this brand");

    // soft delete hook chain: cascade to products under this brand
    await this.productRepository.updateMany({
      filter: { brandId },
      update: { deletedAt: new Date() }
    });

    return deletedBrand.toJSON();
  }
}
