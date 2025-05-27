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
import { UsersService } from 'src/modules/users/users.service';

export type StockMovementType = 'INBOUND' | 'OUTBOUND';
export type StockMovementSource =
  | 'NEW PRODUCT ADDED'
  | 'STOCK ADJUSTMENT'
  | 'SALE'
  | 'LAYAWAY'
  | 'CANCEL';

class LogStockMovementParams {
  stockExtId: string;
  type: StockMovementType;
  source: StockMovementSource;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  createdBy: string;
}

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,

    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,

    private readonly userService: UsersService,
  ) {}

  async logStockMovement(params: LogStockMovementParams): Promise<void> {
    const movement = this.stockMovementRepo.create({
      external_id: generateUniqueId(10),
      stock_ext_id: params.stockExtId,
      type: params.type,
      source: params.source,
      qty_before: params.qty_before,
      qty_change: params.qty_change,
      qty_after: params.qty_after,
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
    const results: IProductTransaction[] = await Promise.all(
      movements.map(async (movement) => {
        const source = movement.source.toLowerCase();
        const statusMap: Record<string, string> = {
          sale: 'sold',
          layaway: 'reserved',
          cancel: 'cancelled',
        };

        const pStatus = statusMap[source] ?? 'none';

        const pBy = await this.userService.getPerformedBy(movement.created_by);

        return {
          stock_id: stock.external_id,
          product_id: stock.product_ext_id,
          type: movement.type,
          source: movement.source,
          qty_before: Number(movement.qty_before),
          change: Number(movement.qty_change),
          qty_after: Number(movement.qty_after),
          status: pStatus,
          performed_by: pBy.data.create?.name || movement.created_by || null,
        };
      }),
    );

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
