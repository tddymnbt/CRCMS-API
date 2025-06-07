import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SalesItems } from 'src/modules/sales/entities/sale-items.entity';
import { Sales } from 'src/modules/sales/entities/sales.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SharedService {
  constructor(
    @InjectRepository(Sales)
    private readonly salesRepo: Repository<Sales>,

    @InjectRepository(SalesItems)
    private readonly salesItemsRepo: Repository<SalesItems>,
  ) {}

  async checkTransactionByClientOrStock(external_id: string): Promise<boolean> {
    const trimmedId = external_id.trim();

    const [client, stock] = await Promise.all([
      this.salesRepo.find({ where: { client_ext_id: trimmedId } }),
      this.salesItemsRepo.find({ where: { product_ext_id: trimmedId } }),
    ]);

    return client.length > 0 || stock.length > 0;
  }
}
