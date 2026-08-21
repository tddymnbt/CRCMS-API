import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Sales } from '../../domain/entities/sales.entity';
import { SalesItems } from '../../domain/entities/sale-items.entity';
import { SaleLayaways } from '../../domain/entities/sale-layaways.entity';
import { PaymentLogs } from '../../domain/entities/payment-logs.entity';
import {
  CustomerFrequencyRow,
  SalesAggregateResult,
  SalesDateRange,
  SalesFindMode,
  SalesRepositoryPort,
} from '../../domain/repositories/sales.repository.port';
import { FindSalesDto } from '../../application/dtos/find-all-sales.dto';

@Injectable()
export class TypeormSalesRepository implements SalesRepositoryPort {
  constructor(
    @InjectRepository(Sales)
    private readonly salesRepo: Repository<Sales>,

    @InjectRepository(SalesItems)
    private readonly salesItemsRepo: Repository<SalesItems>,

    @InjectRepository(SaleLayaways)
    private readonly saleLayawaysRepo: Repository<SaleLayaways>,

    @InjectRepository(PaymentLogs)
    private readonly paymentLogsRepo: Repository<PaymentLogs>,
  ) {}

  async findSales(
    findDto: FindSalesDto,
    mode: SalesFindMode,
    clientExtId?: string,
  ): Promise<[Sales[], number]> {
    const {
      searchValue,
      pageNumber = 1,
      displayPerPage = 10,
      sortBy,
      orderBy,
      dateFrom,
      dateTo,
    } = findDto;

    const skip = (pageNumber - 1) * displayPerPage;

    const queryBuilder = this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('clients', 'c', 's.client_ext_id = c.external_id')
      .leftJoin('sales_items', 'si', 's.external_id = si.sale_ext_id')
      .leftJoin('stocks', 'ps', 'si.product_ext_id = ps.external_id')
      .leftJoin('products', 'p', 'ps.product_ext_id = p.external_id');

    if (mode === 'OD') {
      queryBuilder.leftJoin(
        'sale_layaways',
        'sl',
        's.external_id = sl.sale_ext_id',
      );
    }

    if (searchValue) {
      queryBuilder.andWhere(
        `(
            s.external_id ILIKE :search 
            OR s.created_by ILIKE :search
            OR p.name ILIKE :search
            OR p.code ILIKE :search
            OR CONCAT(c.first_name, ' ', c.last_name) ILIKE :search
        )`,
        { search: `%${searchValue}%` },
      );
    }

    if (dateFrom && dateTo) {
      queryBuilder.andWhere(`s.date_purchased BETWEEN :from AND :to`, {
        from: new Date(dateFrom).toISOString(),
        to: new Date(dateTo).toISOString(),
      });
    } else if (dateFrom) {
      queryBuilder.andWhere(`s.date_purchased >= :from`, {
        from: new Date(dateFrom).toISOString(),
      });
    } else if (dateTo) {
      queryBuilder.andWhere(`s.date_purchased <= :to`, {
        to: new Date(dateTo).toISOString(),
      });
    }

    // Apply mode filtering carefully
    switch (mode) {
      case 'R':
        queryBuilder.andWhere(`s.type = 'R'`);
        break;
      case 'L':
        queryBuilder.andWhere(`s.type = 'L'`);
        break;
      case 'CN':
        queryBuilder.andWhere(`ps.is_consigned = true`);
        break;
      case 'C':
        queryBuilder.andWhere(`s.status = 'Cancelled'`);
        break;
      case 'FP':
        queryBuilder.andWhere(`s.status = 'Fully paid'`);
        break;
      case 'OD':
        // Ensure we only check overdue layaways
        queryBuilder
          .andWhere(`sl.current_due_date < NOW()`)
          .andWhere(`s.type = 'L'`)
          .andWhere(`s.status = 'Deposit'`);
        break;
      case 'CT':
        queryBuilder.andWhere(`s.client_ext_id = :clientId`, {
          clientId: clientExtId.trim(),
        });
        break;
      // case 'A' means all — no extra filter
    }

    return queryBuilder
      .orderBy(`s.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(displayPerPage)
      .getManyAndCount();
  }

  findSaleByExtId(extId: string): Promise<Sales | null> {
    return this.salesRepo.findOne({
      where: { external_id: extId.trim() },
    });
  }

  findLayawaySaleByExtId(extId: string): Promise<Sales | null> {
    return this.salesRepo.findOne({
      where: { external_id: extId.trim(), type: 'L' },
    });
  }

  findActiveSaleByExtId(extId: string): Promise<Sales | null> {
    return this.salesRepo.findOne({
      where: { external_id: extId.trim(), status: Not('Cancelled') },
    });
  }

  createSale(payload: Partial<Sales>): Sales {
    return this.salesRepo.create(payload);
  }

  saveSale(sale: Sales): Promise<Sales> {
    return this.salesRepo.save(sale);
  }

  findItemsBySaleExtId(saleExtId: string): Promise<SalesItems[]> {
    return this.salesItemsRepo.find({
      where: { sale_ext_id: saleExtId.trim() },
    });
  }

  createItem(payload: Partial<SalesItems>): SalesItems {
    return this.salesItemsRepo.create(payload);
  }

  saveItems(items: SalesItems[]): Promise<SalesItems[]> {
    return this.salesItemsRepo.save(items);
  }

  findPaymentsBySaleExtId(saleExtId: string): Promise<PaymentLogs[]> {
    return this.paymentLogsRepo.find({
      where: { sale_ext_id: saleExtId.trim() },
      order: { payment_date: 'DESC' },
    });
  }

  createPayment(payload: Partial<PaymentLogs>): PaymentLogs {
    return this.paymentLogsRepo.create(payload);
  }

  savePayment(payment: PaymentLogs): Promise<PaymentLogs> {
    return this.paymentLogsRepo.save(payment);
  }

  findLayawayBySaleExtId(saleExtId: string): Promise<SaleLayaways | null> {
    return this.saleLayawaysRepo.findOne({
      where: { sale_ext_id: saleExtId.trim() },
    });
  }

  createLayaway(payload: Partial<SaleLayaways>): SaleLayaways {
    return this.saleLayawaysRepo.create(payload);
  }

  saveLayaway(layaway: SaleLayaways): Promise<SaleLayaways> {
    return this.saleLayawaysRepo.save(layaway);
  }

  async getSalesStatusAggregate(
    status: string,
    mode: 'A' | 'CN' | 'R' | 'L',
    range?: SalesDateRange,
  ): Promise<SalesAggregateResult> {
    let query = null;

    if (status === 'Deposit') {
      query = this.salesRepo
        .createQueryBuilder('s')
        .leftJoin(
          (qb) =>
            qb
              .select('pl.sale_ext_id', 'sale_ext_id')
              .addSelect('SUM(pl.amount)', 'total_payments')
              .from('payment_logs', 'pl')
              .groupBy('pl.sale_ext_id'),
          'pl',
          'pl.sale_ext_id = s.external_id',
        )
        .select('COUNT(s.external_id)', 'totalCount')
        .addSelect(
          'SUM(s.total_amount) - COALESCE(SUM(pl.total_payments), 0)',
          'totalAmount',
        )
        .where('s.status = :status', { status });
    } else {
      query = this.salesRepo
        .createQueryBuilder('s')
        .select('SUM(s.total_amount)', 'totalAmount')
        .addSelect('COUNT(*)', 'totalCount')
        .where('s.status = :status', { status });
    }

    if (mode !== 'A') {
      switch (mode) {
        case 'R':
          query.andWhere(`s.type = 'R'`);
          break;
        case 'L':
          query.andWhere(`s.type = 'L'`);
          break;
      }
    }

    if (range?.start && range?.end) {
      query.andWhere('s.date_purchased BETWEEN :start AND :end', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      });
    } else if (range?.start) {
      query.andWhere('s.date_purchased >= :start', {
        start: range.start.toISOString(),
      });
    } else if (range?.end) {
      query.andWhere('s.date_purchased <= :end', {
        end: range.end.toISOString(),
      });
    }

    return query.getRawOne();
  }

  async getCustomerPurchaseFrequencies(
    from: Date,
    to: Date,
  ): Promise<CustomerFrequencyRow[]> {
    return this.salesRepo
      .createQueryBuilder('sales')
      .select('sales.client_ext_id', 'clientId')
      .addSelect(
        `CONCAT(client.first_name, ' ', client.last_name)`,
        'customerName',
      )
      .leftJoin('clients', 'client', 'client.external_id = sales.client_ext_id')
      .where('sales.status = :status', { status: 'Fully paid' })
      .andWhere('sales.date_purchased BETWEEN :from AND :to', { from, to })
      .groupBy('sales.client_ext_id')
      .addGroupBy('client.first_name')
      .addGroupBy('client.last_name')
      .getRawMany();
  }
}
