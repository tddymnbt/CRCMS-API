import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Sales } from './entities/sales.entity';
import { SalesItems } from './entities/sale-items.entity';
import { SaleLayaways } from './entities/sale-layaways.entity';
import { PaymentLogs } from './entities/payment-logs.entity';
import { SalesDto } from './dtos/create-sales.dto';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { ProductsService } from '../products/services/products.service';
import { ClientsService } from '../clients/clients.service';
import { IProduct } from '../products/interfaces/product.interface';
import { IClient } from '../clients/interface/client-response.interface';
import { Repository } from 'typeorm';
import {
  IProductUnit,
  ISaleResponse,
  ISMiscsResponse,
} from './interfaces/sales.interface';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sales)
    private readonly salesRepo: Repository<Sales>,
    @InjectRepository(SalesItems)
    private readonly salesItemsRepo: Repository<SalesItems>,
    @InjectRepository(SaleLayaways)
    private readonly saleLayawaysRepo: Repository<SaleLayaways>,
    @InjectRepository(PaymentLogs)
    private readonly paymentLogsRepo: Repository<PaymentLogs>,

    private readonly productService: ProductsService,
    private readonly clientService: ClientsService,
  ) {}

  async createSale(dto: SalesDto): Promise<ISaleResponse> {
    if (!dto.is_discounted) {
      dto.discount_percentage = null;
      dto.discount_flat_rate = null;
    } else {
      const throwIfMissing = (field: string, message: string): void => {
        if (!field) {
          throw new BadRequestException({
            status: { success: false, message },
          });
        }
      };

      throwIfMissing(
        dto.discount_percentage,
        'Discount percentage is required if product is discount_flat_rate.',
      );
      throwIfMissing(
        dto.discount_flat_rate,
        'Discount flat rate is required if product is discount_flat_rate.',
      );
    }

    const [clientData, productsData] = await Promise.all([
      this.validateClient(dto.client_ext_id),
      this.validateProducts(dto.products),
    ]);

    const sale_ext_id = `S-${generateUniqueId(10)}`;
    const payment_ext_id = `P-${generateUniqueId(10)}`;

    const salesItems = dto.products.map((product) => {
      const validatedProduct = productsData.find(
        (p) => p.stock_external_id === product.product_ext_id,
      );
      if (!validatedProduct) {
        throw new Error(
          `Product with external_id ${product.product_ext_id} not found in validated products.`,
        );
      }

      const unitPrice = validatedProduct.price;
      const qty = product.qty;
      const subtotal = unitPrice * qty;

      return this.salesItemsRepo.create({
        external_id: `SI-${generateUniqueId(10)}`,
        sale_ext_id: sale_ext_id,
        product_ext_id: product.product_ext_id,
        qty: qty,
        unit_price: unitPrice,
        subtotal: subtotal,
        images: product.images ?? [],
        created_by: dto.created_by,
      });
    });

    let totalAmount = salesItems.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0,
    );

    if (dto.is_discounted) {
      const discountPercent = Number(dto.discount_percentage || 0);
      const discountFlatRate = Number(dto.discount_flat_rate || 0);

      if (discountPercent > 0) {
        const discountAmount = totalAmount * (discountPercent / 100);
        totalAmount -= discountAmount;
      } else if (discountFlatRate > 0) {
        totalAmount -= discountFlatRate;
      }

      // Ensure totalAmount doesn’t go below zero
      totalAmount = Math.max(totalAmount, 0);
    }

    const sales = this.salesRepo.create({
      external_id: sale_ext_id,
      client_ext_id: dto.client_ext_id,
      type: dto.type,
      total_amount: totalAmount,
      is_discounted: dto.is_discounted,
      discount_percent: Number(dto.discount_percentage),
      discount_flat_rate: Number(dto.discount_flat_rate),
      date_purchased: dto.date_purchased,
      status: dto.type === 'R' ? 'Fully paid' : 'Deposit',
      created_by: dto.created_by,
    });

    const isDeposit = dto.type === 'L';
    const isFinalPayment = dto.type === 'R';

    const paymentLog = this.paymentLogsRepo.create({
      external_id: payment_ext_id,
      sale_ext_id: sale_ext_id,
      amount: dto.type === 'R' ? totalAmount : Number(dto.payment.amount),
      payment_date: dto.payment.payment_date,
      payment_method: dto.payment.payment_method,
      is_deposit: isDeposit,
      is_final_payment: isFinalPayment,
      created_by: dto.created_by,
    });

    await this.salesRepo.save(sales);
    await this.salesItemsRepo.save(salesItems);
    await this.paymentLogsRepo.save(paymentLog);

    let saleLayaway = null;

    if (dto.type === 'L') {
      const depositAmount = totalAmount - Number(dto.payment.amount);
      saleLayaway = this.saleLayawaysRepo.create({
        sale_ext_id: sale_ext_id,
        no_of_months: dto.layaway.no_of_months,
        amount_due: depositAmount,
        payment_date: null,
        current_due_date: dto.layaway.due_date,
        orig_due_date: dto.layaway.due_date,
        is_extended: false,
        status: 'Unpaid',
        created_by: dto.created_by,
      });

      await this.saleLayawaysRepo.save(saleLayaway);
    }

    return {
      status: {
        success: true,
        message: 'Sale successfully recorded',
      },
      data: this.buildCreateSaleResponse(
        sales,
        clientData,
        productsData,
        salesItems,
        paymentLog,
        saleLayaway,
      ),
    };
  }
  async validateProducts(
    products: { product_ext_id: string; qty: number }[],
  ): Promise<IProduct[]> {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const insufficientStock: string[] = [];
    const notFoundProducts: string[] = [];
    const validatedProducts: IProduct[] = [];

    for (const item of products) {
      const trimmedId = item.product_ext_id.trim();

      // Check duplicate
      if (seen.has(trimmedId)) {
        duplicates.push(trimmedId);
        continue;
      }
      seen.add(trimmedId);

      // Fetch product
      const productData = await this.productService
        .findOne(trimmedId)
        .then((res) => res?.data ?? null);

      if (!productData) {
        notFoundProducts.push(trimmedId);
        continue;
      }

      // Check quantity
      if (item.qty > productData.stock.qty_in_stock) {
        insufficientStock.push(
          `${trimmedId} (requested: ${item.qty}, available: ${productData.stock.qty_in_stock})`,
        );
      }

      validatedProducts.push(productData);
    }

    // Throw errors if any
    if (duplicates.length > 0) {
      throw new BadRequestException(
        `Duplicate product_ext_id(s) found: ${duplicates.join(', ')}`,
      );
    }

    if (notFoundProducts.length > 0) {
      throw new NotFoundException(
        `Product(s) not found: ${notFoundProducts.join(', ')}`,
      );
    }

    if (insufficientStock.length > 0) {
      throw new BadRequestException(
        `Insufficient stock for product(s): ${insufficientStock.join(', ')}`,
      );
    }

    return validatedProducts;
  }

  async validateClient(client_ext_id: string): Promise<IClient> {
    const client = await this.clientService.findOne(client_ext_id.trim());
    return client?.data ?? null;
  }

  private buildCreateSaleResponse(
    saleEntity: Sales, // Sales entity
    clientData: IClient, // Client info
    productsData: ISMiscsResponse['product_Data'][], // Product metadata
    saleItems: SalesItems[], // Sale items
    paymentLogs: PaymentLogs[] | PaymentLogs | null, // Single or multiple logs
    layawayPlan?: SaleLayaways, // Optional layaway
  ): ISaleResponse['data'] | null {
    // Ensure paymentLogs is an array
    const paymentLogsArray: PaymentLogs[] = Array.isArray(paymentLogs)
      ? paymentLogs
      : paymentLogs
        ? [paymentLogs]
        : [];

    // Map sale items to IProductUnit[]
    const productUnits: IProductUnit[] = saleItems.map((item) => {
      const product = productsData.find(
        (p) => p.product_external_id === item.product_ext_id,
      );

      return {
        external_id: item.product_ext_id,
        name: product?.name ?? '',
        is_consigned: product?.is_consigned ?? false,
        unit_price: Number(item.unit_price).toFixed(2),
        qty: item.qty,
        subtotal: Number(item.subtotal).toFixed(2),
        images: item.images ?? [],
      };
    });

    // Calculate total paid amount
    const totalPaidAmount = paymentLogsArray.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // Determine base amount (depends on sale type)
    const baseAmount = Number(saleEntity.total_amount);

    // Calculate outstanding balance (never negative)
    const outstandingBalance = Math.max(
      baseAmount - totalPaidAmount,
      0,
    ).toFixed(2);

    return {
      sale_external_id: saleEntity.external_id,
      date_purchased: saleEntity.date_purchased,
      Customer: {
        external_id: clientData.external_id,
        name: `${clientData.first_name} ${clientData.last_name}`,
      },
      type: {
        code: saleEntity.type,
        description: saleEntity.type === 'R' ? 'Regular' : 'Layaway',
      },
      layaway_plan: layawayPlan
        ? {
            no_of_months: layawayPlan.no_of_months.toString(),
            amount_due: Number(layawayPlan.amount_due).toFixed(2),
            current_due_date: layawayPlan.current_due_date,
            orig_due_date: layawayPlan.orig_due_date,
            is_extended: layawayPlan.is_extended,
            status: layawayPlan.status,
          }
        : undefined,
      product: productUnits,
      total_amount: baseAmount.toFixed(2),
      outstanding_balance: outstandingBalance,
      is_discounted: saleEntity.is_discounted,
      discount_percent: Number(saleEntity.discount_percent).toFixed(2),
      discount_flat_rate: Number(saleEntity.discount_flat_rate).toFixed(2),
      status: saleEntity.status,
      payment_history: paymentLogsArray.map((payment) => ({
        external_id: payment.external_id,
        amount: Number(payment.amount).toFixed(2),
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
      })),
      created_at: saleEntity.created_at,
      created_by: saleEntity.created_by,
      cancelled_at: saleEntity.cancelled_at ?? null,
      cancelled_by: saleEntity.cancelled_by ?? null,
    };
  }
}
