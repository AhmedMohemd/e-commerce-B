import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { RemoveItemsFromCart, UpdateCartDto } from './dto/update-cart.dto';
import { ProductRepository } from '../../common/repository/product.repository';
import { CartRepository } from 'src/common/repository';
import { toObjectId } from 'src/common/utils/object_Id';
import type{ HUserDocument } from 'src/model';
import { ICart } from 'src/common/interfaces';
import { CacheService } from 'src/common/utils/service';

@Injectable()
export class CartService {
  constructor(

    private readonly redis:CacheService,
    private readonly productRepository:ProductRepository,
    private readonly cartRepository:CartRepository
  ) { }
  async clearCache(user: HUserDocument) {
    await this.redis.deleteKey(this.redis.getCacheKey('/cart', user._id.toString()))
  }
  async create({ productId, quantity }: CreateCartDto, user: HUserDocument): Promise<ICart> {

    productId = toObjectId(productId as unknown as string);

    const product = await this.productRepository.findOne({ filter: { _id: productId, stock: { $gte: quantity } } })
    if (!product) throw new NotFoundException("Fail to find matching product or out of stock")

    let cart = await this.cartRepository.findOne({ filter: { createdBy: user._id } })

    if (!cart) {
      cart = await this.cartRepository.createOne({
        data: {
          createdBy: user._id,
          products: [{ productId, quantity: quantity > 0 ? quantity : 1 }]
        }
      })
      await this.clearCache(user)
      return cart.toJSON()
    }
    let match: boolean = false

    for (const item of cart.products) {
      if (item.productId.toString() == productId.toString()) {
        item.quantity += quantity;
        item.quantity = item.quantity > 0 ? item.quantity : 1
        if (product.stock < item.quantity) {
          throw new NotFoundException("product out of stock")
        }
        match = true
      }
    }
    if (!match) {
      cart.products.push({ productId, quantity: quantity > 0 ? quantity : 1 })
    }
    await cart.save()
    await this.clearCache(user)
    return cart.toJSON();
  }

  // findAll() {
  //   return `This action returns all cart`;
  // }

  async findOne(user: HUserDocument): Promise<ICart> {
    const cart = await this.cartRepository.findOne({
      filter: { createdBy: user._id },
      options: {
        populate: [{ path: "products.productId" }]
      }
    })

    if (!cart) {
      throw new NotFoundException("Cart is empty")
    }
    return cart.toJSON()
  }
  async update(user: HUserDocument, { productIds }: RemoveItemsFromCart): Promise<ICart> {
    productIds = productIds.map(ele => toObjectId(ele as unknown as string))
    const cart = await this.cartRepository.findOneAndUpdate({
      filter: { createdBy: user._id },
      update: {
        $pull: { products: { productId: { $in: productIds } } }
      }
    })
    if (!cart) {
      throw new NotFoundException(`Cart is empty`)
    }
    await this.clearCache(user)
    return cart?.toJSON()
  }

  async remove(user: HUserDocument): Promise<ICart> {
    const cart = await this.cartRepository.findOneAndDelete({
      filter: { createdBy: user._id }
    })
    if (!cart) {
      throw new NotFoundException(`Cart is empty`)
    }
    await this.clearCache(user)
    return cart?.toJSON()
  }
}
