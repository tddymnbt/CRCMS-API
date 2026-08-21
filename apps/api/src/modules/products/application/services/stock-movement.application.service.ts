import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { FindProductTransactionsDto } from '../dtos/find-p-trans.dto';
import {
  IProductTransaction,
  IProductTransactionsResponse,
} from '../interfaces/p-trans.interface';
import { UsersApplicationService } from 'src/modules/users/application/services/users.application.service';
import {
  STOCK_MOVEMENTS_REPOSITORY,
  StockMovementsRepositoryPort,
} from '../../domain/repositories/stock-movements.repository.port';
import {
  PRODUCTS_REPOSITORY,
  ProductsRepositoryPort,
} from '../../domain/repositories/products.repository.port';

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
export class StockMovementApplicationService {
  constructor(
    @Inject(STOCK_MOVEMENTS_REPOSITORY)
    private readonly stockMovementsRepository: StockMovementsRepositoryPort,

    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: ProductsRepositoryPort,

    private readonly userService: UsersApplicationService,
  ) {}

  async logStockMovement(params: LogStockMovementParams): Promise<void> {
    const movement = this.stockMovementsRepository.createMovement({
      external_id: generateUniqueId(10),
      stock_ext_id: params.stockExtId,
      type: params.type,
      source: params.source,
      qty_before: params.qty_before,
      qty_change: params.qty_change,
      qty_after: params.qty_after,
      created_by: params.createdBy,
    });

    await this.stockMovementsRepository.saveMovement(movement);
  }

  async getProductTransaction(
    stock_ext_id: string,
    dto: FindProductTransactionsDto,
  ): Promise<IProductTransactionsResponse> {
    const { pageNumber, displayPerPage } = dto;

    // 1. Check if stock exists
    const stock = await this.productsRepository.findStockByExtId(stock_ext_id);

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }

    // 2. Query stock movements
    const [movements, totalCount] =
      await this.stockMovementsRepository.findMovements(stock_ext_id, dto);

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
