import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginateProductsResponse, SayHiResponse } from './entities/product.entity';
import { SayHiInputsDto } from './dto/create-product.dto';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import type { HUserDocument } from 'src/model';
import { ProductService } from './product.service';
import { PaginateGQLDto } from 'src/common/dto/paginate.dto';
import { IPaginate, IProduct } from 'src/common/interfaces';
import { UseInterceptors } from '@nestjs/common';
import { CustomCacheInterceptor } from 'src/common/interceptor/cache.interceptor';

@Resolver()
export class ProductResolver {
    constructor(
        private readonly productService:ProductService
    ) { 
           
    }

@UseInterceptors(CustomCacheInterceptor)
    @Query(() => PaginateProductsResponse)
    async allProducts(
        @Args() args: PaginateGQLDto
    ): Promise<IPaginate<IProduct>> {
        const result = await this.productService.findAll(args)
        return result

    }

@Auth([RoleEnum.ADMIN])
    @Query(() => [SayHiResponse], { description: "FIRST API", nullable: false })
    sayHi(
        @Args({ type: () => SayHiInputsDto, nullable: true }) data: SayHiInputsDto,
        @User() user:HUserDocument
 ): { message: string, age?: number }[] {
        console.log(user);

        return [{ message: data?.name ?? "Hi", age: data?.age }]
    }

    @Mutation(() => [SayHiResponse], { description: "FIRST API", nullable: false })
    lol(): { message: string, age?: number }[] {
        return [{ message: "Hello GQL", age: 26 }]
    }

}