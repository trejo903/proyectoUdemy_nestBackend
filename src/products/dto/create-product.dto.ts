import { IsInt, IsNotEmpty, IsNumber, IsString } from "class-validator"


export class CreateProductDto {
    @IsNotEmpty({message:'El nombre del producto es obligatorio'})
    @IsString({message:'Nombre no valido'})
    name:string

    @IsNotEmpty({message:'La imagen del producto es obligatorio'})
    image:string

    @IsNotEmpty({message:'El precio del producto es obligatorio'})
    @IsNumber({maxDecimalPlaces:2},{message:'Precio no valido'})
    price:number

    @IsNotEmpty({message:'La cantidad no puede ir vacia'})
    @IsNumber({maxDecimalPlaces:0},{message:'Cantidad no valida'})
    inventory:number

    @IsNotEmpty({message:'La categoria es obligatoria'})
    @IsInt({message:'La categoria no es valida'})
    categoryId:number
}
