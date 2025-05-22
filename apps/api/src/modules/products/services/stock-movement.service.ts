// stock-movement.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { FindProductTransactionsDto } from '../dtos/find-p-trans.dto';
import {
  IProductTransaction,
  IProductTransactionsResponse,
} from '../interfaces/p-trans.interface';
import { Stock } from '../entities/stock.entity';

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

    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
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

  async getProductTransaction(
    stock_ext_id: string,
    dto: FindProductTransactionsDto,
  ): Promise<IProductTransactionsResponse> {
    const {
      searchValue,
      pageNumber,
      displayPerPage,
      sortBy = 'created_at',
      orderBy = 'desc',
    } = dto;

    // 1. Check if stock exists
    const stock = await this.stockRepo.findOne({
      where: { external_id: stock_ext_id },
    });

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }

    // 2. Query stock movements
    const query = this.stockMovementRepo
      .createQueryBuilder('sm')
      .where('sm.stock_ext_id = :stock_ext_id', { stock_ext_id });

    if (searchValue) {
      query.andWhere(
        `(
          sm.type ILIKE :search
          OR sm.source ILIKE :search
          OR CAST(sm.qty AS TEXT) ILIKE :search
        )`,
        { search: `%${searchValue}%` },
      );
    }

    query
      .orderBy(`sm.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * displayPerPage)
      .take(displayPerPage);

    const [movements, totalCount] = await query.getManyAndCount();

    // 3. Map results
    const results: IProductTransaction[] = movements.map((movement) => {
      const qtyBefore =
        movement.type === 'INBOUND'
          ? stock.avail_qty - movement.qty
          : movement.type === 'OUTBOUND'
            ? stock.avail_qty + movement.qty
            : null;

      return {
        stock_id: stock.external_id,
        product_id: stock.product_ext_id,
        type: movement.type,
        source: movement.source,
        qty_before: Number(qtyBefore),
        change: Number(movement.qty),
        qty_after: Number(stock.avail_qty),
      };
    });

    return {
      status: {
        success: true,
        message: 'Product Movements fetched successfully',
      },
      data: results,
      meta: {
        page: pageNumber,
        totalNumber: totalCount,
        totalPages: Math.ceil(totalCount / displayPerPage),
        displayPage: displayPerPage,
      },
    };
  }
}
