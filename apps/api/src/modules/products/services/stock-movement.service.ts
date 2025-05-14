// stock-movement.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';

export type StockMovementType = 'INBOUND' | 'OUTBOUND';
export type StockMovementSource =
  | 'NEW PRODUCT ADDED'
  | 'STOCK ADJUSTMENT'
  | 'SALE'
  | 'LAYAWAY'
  | 'RETURN'
  | 'DELETE';

class LogStockMovementParams {
  stockExtId: string;
  type: StockMovementType;
  source: StockMovementSource;
  qty: number;
  createdBy: string;
}

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
  ) {}

  async logStockMovement(params: LogStockMovementParams): Promise<void> {
    const movement = this.stockMovementRepo.create({
      external_id: generateUniqueId(10),
      stock_ext_id: params.stockExtId,
      type: params.type,
      source: params.source,
      qty: params.qty,
      created_by: params.createdBy,
    });

    await this.stockMovementRepo.save(movement);
  }
}
