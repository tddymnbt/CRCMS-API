import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import { StockMovementsRepositoryPort } from '../../domain/repositories/stock-movements.repository.port';
import { FindProductTransactionsDto } from '../../application/dtos/find-p-trans.dto';

@Injectable()
export class TypeormStockMovementsRepository
  implements StockMovementsRepositoryPort
{
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
  ) {}

  createMovement(payload: Partial<StockMovement>): StockMovement {
    return this.stockMovementRepo.create(payload);
  }

  saveMovement(movement: StockMovement): Promise<StockMovement> {
    return this.stockMovementRepo.save(movement);
  }

  async findMovements(
    stockExtId: string,
    dto: FindProductTransactionsDto,
  ): Promise<[StockMovement[], number]> {
    const {
      searchValue,
      pageNumber,
      displayPerPage,
      sortBy = 'created_at',
      orderBy = 'desc',
    } = dto;

    const query = this.stockMovementRepo
      .createQueryBuilder('sm')
      .where('sm.stock_ext_id = :stock_ext_id', { stock_ext_id: stockExtId });

    if (searchValue) {
      query.andWhere(
        `(
          sm.type ILIKE :search
          OR sm.source ILIKE :search
          OR CAST(sm.qty_before AS TEXT) ILIKE :search
          OR CAST(sm.qty_change AS TEXT) ILIKE :search
          OR CAST(sm.qty_after AS TEXT) ILIKE :search
        )`,
        { search: `%${searchValue}%` },
      );
    }

    query
      .orderBy(`sm.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * displayPerPage)
      .take(displayPerPage);

    return query.getManyAndCount();
  }
}
