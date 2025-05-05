import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionsContents } from './entities/transaction.entity';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionsContents) private readonly transactionContentsRepository: Repository<TransactionsContents>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    private readonly couponService:CouponsService
  ){

  }

  async create(createTransactionDto: CreateTransactionDto) {

    await this.productRepository.manager.transaction(async(transactionEntityManager)=>{
      const transaction = new Transaction()
      const total = createTransactionDto.contents.reduce((total,item)=>(item.quantity*item.price)+total,0)
      transaction.total = total

      if(createTransactionDto.coupon){
        const coupon = await this.couponService.applyCoupon(createTransactionDto.coupon)
        const discount = (coupon.percentage/100)*total
        transaction.discount = discount
        transaction.coupon = coupon.name
        transaction.total -=discount
      }
    

    for(const contents of createTransactionDto.contents){
      const product = await transactionEntityManager.findOneBy(Product,{id:contents.productId})
      const errors :string[]= []
      if (!product) {
        errors.push(`El producto con el ID:${contents.productId} no existe`)
        throw new NotFoundException(errors);
      }
      if(contents.quantity>product.inventory){
        errors.push(`El articulo ${product.name} excede la cantidad disponible`)
        throw new BadRequestException(errors)
      }
      product.inventory -= contents.quantity


      const transactionContent = new TransactionsContents()
      transactionContent.price=contents.price
      transactionContent.product=product
      transactionContent.quantity=contents.quantity
      transactionContent.transaction = transaction

      await transactionEntityManager.save(transaction)
      await transactionEntityManager.save(transactionContent)
    }

    })

    return {message:"Venta almacenada correctamente"}
  }

  findAll(transactionDate?:string) {
    const options:FindManyOptions<Transaction>={
      relations:{
        contents:true
      }
    }
    if(transactionDate){
      const date = parseISO(transactionDate)
      if(!isValid(date)){
        throw new BadRequestException('Fecha no valida')
      }
      const start  = startOfDay(date)
      const end  = endOfDay(date)

      options.where={
        transactionDate:Between(start,end)
      }
    }


    return this.transactionRepository.find(options)
  }

  async findOne(id: number) {
    const transaction = await this.transactionRepository.findOne({
      where:{
        id
      },
      relations:{
        contents:true
      }
    })
    if(!transaction){
      throw new NotFoundException('Transaccion no encontrada')
    }
    return transaction
  }

  async remove(id: number) {
    const transaction = await this.findOne(id)
    for(const contents of transaction.contents){
      const product = await this.productRepository.findOneBy({id:contents.product.id})
      if (!product) {
        throw new NotFoundException(`El producto con el ID:${contents.product.id} no existe`);
      }
      product.inventory +=contents.quantity
      await this.productRepository.save(product)


      const transactionsContents = await this.transactionContentsRepository.findOneBy({id:contents.id})
      if(!transactionsContents){
        throw new NotFoundException('Transaccion no encontrada')
      }
      await this.transactionContentsRepository.remove(transactionsContents)
    }
    await this.transactionRepository.remove(transaction)
    return {message:'Venta eliminada'};
  }
}
