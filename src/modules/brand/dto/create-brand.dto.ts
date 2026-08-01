import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { IBrand } from "src/common/interfaces";

export class CreateBrandDto implements Partial<IBrand> {
    @MaxLength(50)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    name!: string;
}