import { StockMovement } from '../entities/stock-movement.entity';
import { FindProductTransactionsDto } from '../../application/dtos/find-p-trans.dto';

export const STOCK_MOVEMENTS_REPOSITORY = Symbol('STOCK_MOVEMENTS_REPOSITORY');

export interface StockMovementsRepositoryPort {
  createMovement(payload: Partial<StockMovement>): StockMovement;
  saveMovement(movement: StockMovement): Promise<StockMovement>;
  findMovements(
    stockExtId: string,
    dto: FindProductTransactionsDto,
  ): Promise<[StockMovement[], number]>;
}
