import { Sales } from '../entities/sales.entity';
import { SalesItems } from '../entities/sale-items.entity';
import { SaleLayaways } from '../entities/sale-layaways.entity';
import { PaymentLogs } from '../entities/payment-logs.entity';
import { FindSalesDto } from '../../application/dtos/find-all-sales.dto';

export const SALES_REPOSITORY = Symbol('SALES_REPOSITORY');

export type SalesFindMode = 'A' | 'CN' | 'R' | 'L' | 'C' | 'OD' | 'FP' | 'CT';

export interface SalesDateRange {
  start?: Date;
  end?: Date;
}

export interface SalesAggregateResult {
  totalAmount?: string;
  totalCount?: string;
}

export interface CustomerFrequencyRow {
  clientId: string;
  customerName: string;
  orders: string;
}

export interface SalesRepositoryPort {
  findSales(
    findDto: FindSalesDto,
    mode: SalesFindMode,
    clientExtId?: string,
  ): Promise<[Sales[], number]>;
  findSaleByExtId(extId: string): Promise<Sales | null>;
  findLayawaySaleByExtId(extId: string): Promise<Sales | null>;
  findActiveSaleByExtId(extId: string): Promise<Sales | null>;
  createSale(payload: Partial<Sales>): Sales;
  saveSale(sale: Sales): Promise<Sales>;

  findItemsBySaleExtId(saleExtId: string): Promise<SalesItems[]>;
  createItem(payload: Partial<SalesItems>): SalesItems;
  saveItems(items: SalesItems[]): Promise<SalesItems[]>;

  findPaymentsBySaleExtId(saleExtId: string): Promise<PaymentLogs[]>;
  createPayment(payload: Partial<PaymentLogs>): PaymentLogs;
  savePayment(payment: PaymentLogs): Promise<PaymentLogs>;

  findLayawayBySaleExtId(saleExtId: string): Promise<SaleLayaways | null>;
  createLayaway(payload: Partial<SaleLayaways>): SaleLayaways;
  saveLayaway(layaway: SaleLayaways): Promise<SaleLayaways>;

  getSalesStatusAggregate(
    status: string,
    mode: 'A' | 'CN' | 'R' | 'L',
    range?: SalesDateRange,
  ): Promise<SalesAggregateResult>;
  getCustomerPurchaseFrequencies(
    from: Date,
    to: Date,
  ): Promise<CustomerFrequencyRow[]>;
}
