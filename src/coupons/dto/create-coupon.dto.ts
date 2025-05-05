import { IsDateString, IsInt, IsNotEmpty, Max, Min } from "class-validator"

export class CreateCouponDto {
    @IsNotEmpty({message:'El nombre del cupon es obligatorio'})
    name:string
    

    @IsNotEmpty({message:'El descuento no puede ir vacio'})
    @IsInt({message:'El descuento debe ser entre 1 y 100'})
    @Max(100,{message:'El descuento maximo es de 100'})
    @Min(1,{message:'El descuento minimo es de 1'})
    percentage:number
    

    @IsNotEmpty({message:'La fecha no puede ir vacia'})
    @IsDateString({},{message:'Fecha no valida'})
    expirationDate:Date
}
