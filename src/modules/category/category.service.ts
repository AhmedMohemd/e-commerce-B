import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BrandRepository, CategoryRepository, ProductRepository } from 'src/common/repository';
import { S3Service } from 'src/common/utils/service';
import type { HUserDocument } from 'src/model';
import { CreateCategoryDto } from './dto/create-category.dto';
import type { ICategory, IFile } from 'src/common/interfaces';
import { UpdateCategoryDto, UpdateCategoryParamsDto } from './dto/update-category.dto';
import { toObjectId } from 'src/common/utils/object_Id';
import { generateSlug } from 'src/common/utils/slug';
import { Types } from 'mongoose';

@Injectable()
export class CategoryService {

  constructor(
    private readonly s3Service: S3Service,
    private readonly brandRepository: BrandRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository

  ) { }

  async create({ name, brandIds = [] }: CreateCategoryDto, user: HUserDocument, file: IFile): Promise<ICategory> {
    brandIds = brandIds.map((ele) => { return toObjectId(ele as string) })
    const checkDuplicated = await this.categoryRepository.findOne({ filter: { name, paranoid: false } });
    if (checkDuplicated) throw new ConflictException("Category Already Exist");

    if (brandIds.length != (await this.brandRepository.find({ filter: { _id: { $in: brandIds } } })).length) {
      throw new NotFoundException("Missing some or all of mentioned brands");
    }

    const image = await this.s3Service.uploadAsset({ file, path: `Categories` });
    const Category = await this.categoryRepository.createOne({
      data: {
        name,
        image,
        brandIds,
        createdBy: user._id
      }
    })
    if (!Category) {
      await this.s3Service.deleteAsset({ Key: image })
      throw new BadRequestException("Fail to create this Category instance")
    }
    return Category.toJSON()
  }

  async update(
    { categoryId }: UpdateCategoryParamsDto,
    { name, brandIds = [], removeBrandIds = [] }: UpdateCategoryDto,
    user: HUserDocument,
    file?: IFile
  ): Promise<ICategory> {
    categoryId = toObjectId(categoryId as string)
    brandIds = brandIds.map((ele) => { return toObjectId(ele as string) })

    if (name) {
      const checkDuplicated = await this.categoryRepository.findOne({ filter: { name, _id: { $ne: categoryId }, paranoid: false } });
      if (checkDuplicated) throw new ConflictException("Category Already Exist");
    }

    if (brandIds.length != (await this.brandRepository.find({ filter: { _id: { $in: brandIds } } })).length) {
      throw new NotFoundException("Missing some or all of mentioned brands");
    }
    let image!: string;
    if (file) {
      image = await this.s3Service.uploadAsset({ file, path: `Categories` })
    }
    const category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: [
        {
          $set: {
            updatedBy: user._id,
            ...(name ? { name, slug: generateSlug(name) } : {}),
            ...(file ? { image } : {}),
            brandIds: {
              $setUnion: [
                {
                  $setDifference: [
                    "$brandIds",
                    removeBrandIds.map(ele => toObjectId(ele))
                  ]
                },
                brandIds
              ]
            }
          }
        }
      ],
      options: { new: false }
    })
    if (!category) {
      await this.s3Service.deleteAsset({ Key: image });
      throw new BadRequestException("Fail to update")
    }
    await this.s3Service.deleteAsset({ Key: category.image });

    category.toObject().image = image
    // category.image = image


    return category.toJSON();
  }



  findAll() {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }



async remove({ categoryId }: UpdateCategoryParamsDto, user: HUserDocument): Promise<ICategory> {
    categoryId = toObjectId(categoryId as string);

    const category = await this.categoryRepository.findOne({ filter: { _id: categoryId } });
    if (!category) throw new NotFoundException("Category not exist");

    const deletedCategory = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: { deletedAt: new Date(), updatedBy: user._id }
    });
    if (!deletedCategory) throw new BadRequestException("Fail to delete this category");

    // soft delete hook chain: cascade to related brands then to their/this category's products
    const brandIds = (category.brandIds || []) as Types.ObjectId[];

    if (brandIds.length) {
      await this.brandRepository.updateMany({
        filter: { _id: { $in: brandIds } },
        update: { deletedAt: new Date() }
      });
    }

    await this.productRepository.updateMany({
      filter: {
        $or: [
          { categoryId },
          ...(brandIds.length ? [{ brandId: { $in: brandIds } }] : [])
        ]
      },
      update: { deletedAt: new Date() }
    });

    return deletedCategory.toJSON();
  }
}
