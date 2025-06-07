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
import { Not, Repository } from 'typeorm';
import {
  CustomerFrequencyResponse,
  CustomerFrequencyResult,
  IProductUnit,
  ISaleResponse,
  ISalesResponse,
  ISaleTransactionsResponse,
  ISMiscsResponse,
} from './interfaces/sales.interface';
import { FindSalesDto } from './dtos/find-all-sales.dto';
import { UsersService } from '../users/users.service';
import { RecordPaymentDto } from './dtos/record-payment.dto';
import { CancelSaleDto } from './dtos/cancel-sale.dto';
import { ExtendLayawayDueDateDto } from './dtos/extend-due-date.dto';
import { CustomerPurchaseFrequencyDto } from './dtos/customer-purchase-frequency.dto';

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
    private readonly userService: UsersService,
  ) {}

  async findAll(
    findDto: FindSalesDto,
    mode: 'A' | 'CN' | 'R' | 'L' | 'C' | 'OD' | 'FP' | 'CT',
    client_ext_id?: string,
  ): Promise<ISalesResponse> {
    // A = All, CN = Consign, R = Regular, L = Layaway, C = Cancelled, OD = Overdue, FP = Fully paid, CT = Client's transctions

    const {
      searchValue,
      pageNumber,
      displayPerPage,
      sortBy,
      orderBy,
      dateFrom,
      dateTo,
    } = findDto;

    if (mode === 'CT' && !client_ext_id) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Client`s external Id is required',
        },
      });
    }

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
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new BadRequestException({
          status: {
            success: false,
            message: 'Invalid date format. Please use YYYY-MM-DD.',
          },
        });
      }

      if (fromDate > toDate) {
        throw new BadRequestException({
          status: {
            success: false,
            message: '`dateFrom` must not be after `dateTo`.',
          },
        });
      }

      queryBuilder.andWhere(`s.date_purchased BETWEEN :from AND :to`, {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });
    } else if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (isNaN(fromDate.getTime())) {
        throw new BadRequestException({
          status: {
            success: false,
            message: 'Invalid dateFrom format. Please use YYYY-MM-DD.',
          },
        });
      }
      queryBuilder.andWhere(`s.date_purchased >= :from`, {
        from: fromDate.toISOString(),
      });
    } else if (dateTo) {
      const toDate = new Date(dateTo);
      if (isNaN(toDate.getTime())) {
        throw new BadRequestException({
          status: {
            success: false,
            message: 'Invalid dateTo format. Please use YYYY-MM-DD.',
          },
        });
      }
      queryBuilder.andWhere(`s.date_purchased <= :to`, {
        to: toDate.toISOString(),
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
          clientId: client_ext_id.trim(),
        });
        break;
      // case 'A' means all — no extra filter
    }

    const [sales, totalNumber] = await queryBuilder
      .orderBy(`s.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(displayPerPage)
      .getManyAndCount();

    const enrichedSales = await Promise.all(
      sales.map(async (sale) => {
        const [
          salesItems,
          paymentHistory,
          salesLayaway,
          clientData,
          productsData,
          performedBy,
        ] = await Promise.all([
          this.salesItemsRepo.find({
            where: { sale_ext_id: sale.external_id },
          }),
          this.paymentLogsRepo.find({
            where: { sale_ext_id: sale.external_id },
            order: { payment_date: 'DESC' },
          }),
          this.saleLayawaysRepo.findOne({
            where: { sale_ext_id: sale.external_id },
          }),
          this.validateClient(sale.client_ext_id),
          this.validateProducts(
            (
              await this.salesItemsRepo.find({
                where: { sale_ext_id: sale.external_id },
              })
            ).map((item) => ({ product_ext_id: item.product_ext_id })),
            'read',
          ),
          this.userService.getPerformedBy(sale.created_by, sale.cancelled_by),
        ]);

        const saleResponse = this.buildCreateSaleResponse(
          sale,
          clientData,
          productsData,
          salesItems,
          paymentHistory,
          salesLayaway,
        );

        return {
          ...saleResponse,
          created_by:
            performedBy.data.create?.name || saleResponse.created_by || null,
          cancelled_by:
            performedBy.data.update?.name || saleResponse.cancelled_by || null,
        };
      }),
    );

    const totalPages = Math.ceil(totalNumber / displayPerPage);

    return {
      status: {
        success: true,
        message: 'Sales transactions retrieved',
      },
      data: enrichedSales,
      meta: {
        page: pageNumber,
        totalNumber,
        totalPages,
        displayPage: displayPerPage,
      },
    };
  }

  async findOne(external_id: string): Promise<ISaleResponse> {
    const sales = await this.salesRepo.findOne({
      where: { external_id: external_id.trim() },
    });

    if (!sales) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Sales transaction not found',
        },
      });
    }

    const salesItems = await this.salesItemsRepo.find({
      where: { sale_ext_id: external_id.trim() },
    });

    if (!salesItems || salesItems.length === 0) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Sold products not found',
        },
      });
    }

    const paymentHistory = await this.paymentLogsRepo.find({
      where: { sale_ext_id: external_id.trim() },
      order: { payment_date: 'DESC' },
    });

    if (!paymentHistory || paymentHistory.length === 0) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Payment history not found',
        },
      });
    }

    const salesLayaway = await this.saleLayawaysRepo.findOne({
      where: { sale_ext_id: external_id.trim() },
    });

    const [clientData, productsData] = await Promise.all([
      this.validateClient(sales.client_ext_id),
      this.validateProducts(
        salesItems.map((item) => ({ product_ext_id: item.product_ext_id })),
        'read',
      ),
    ]);
    const createdBy = await this.userService.getPerformedBy(sales.created_by);
    const cancelledBy = await this.userService.getPerformedBy(
      sales.cancelled_by,
    );

    return {
      status: {
        success: true,
        message: 'Sale transaction found',
      },
      data: this.buildCreateSaleResponse(
        {
          ...sales,
          created_by: createdBy.data.create?.name || sales.created_by || null,
          cancelled_by:
            cancelledBy.data.create?.name || sales.cancelled_by || null,
        },
        clientData,
        productsData,
        salesItems,
        paymentHistory,
        salesLayaway,
      ),
    };
  }

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
      this.validateProducts(dto.products, 'create'),
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
      images: dto.images ?? [],
      created_by: dto.created_by,
    });

    const isDeposit = dto.type === 'L';
    const isFinalPayment = dto.type === 'R';

    const paymentLog = this.paymentLogsRepo.create({
      external_id: payment_ext_id,
      sale_ext_id: sale_ext_id,
      amount:
        dto.type === 'R'
          ? totalAmount
          : Number(dto.payment.amount.replace(/,/g, '')),
      payment_date: dto.payment.payment_date,
      payment_method: dto.payment.payment_method,
      is_deposit: isDeposit,
      is_final_payment: isFinalPayment,
      created_by: dto.created_by,
    });

    // Update stock before saving sales items
    for (const item of salesItems) {
      await this.productService.updateStockFromSale(item.product_ext_id, {
        type: dto.type === 'R' ? 'sale' : 'layaway', // R: Regular Sale, L: Layaway
        qty: item.qty,
        updated_by: dto.created_by,
      });
    }

    let saleLayaway = null;

    if (dto.type === 'L') {
      if (Number(dto.payment.amount.replace(/,/g, '')) > Number(totalAmount)) {
        throw new BadRequestException({
          status: {
            success: false,
            message: 'Payment amount is greater than the total amount due.',
          },
        });
      }

      const amountDue =
        totalAmount - Number(dto.payment.amount.replace(/,/g, ''));
      saleLayaway = this.saleLayawaysRepo.create({
        sale_ext_id: sale_ext_id,
        no_of_months: dto.layaway.no_of_months,
        amount_due: amountDue,
        payment_date: null,
        current_due_date: dto.layaway.due_date,
        orig_due_date: dto.layaway.due_date,
        is_extended: false,
        status: amountDue > 0 ? 'Unpaid' : 'Paid',
        created_by: dto.created_by,
      });

      await this.saleLayawaysRepo.save(saleLayaway);

      if (amountDue <= 0) {
        sales.status = 'Fully paid';
      }
    }

    await this.salesRepo.save(sales);
    await this.salesItemsRepo.save(salesItems);
    await this.paymentLogsRepo.save(paymentLog);

    const createdBy = await this.userService.getPerformedBy(sales.created_by);
    const cancelledBy = await this.userService.getPerformedBy(
      sales.cancelled_by,
    );

    return {
      status: {
        success: true,
        message: 'Sale successfully recorded',
      },
      data: this.buildCreateSaleResponse(
        {
          ...sales,
          created_by: createdBy.data.create?.name || sales.created_by || null,
          cancelled_by:
            cancelledBy.data.create?.name || sales.cancelled_by || null,
        },
        clientData,
        productsData,
        salesItems,
        paymentLog,
        saleLayaway,
      ),
    };
  }

  async recordPayment(dto: RecordPaymentDto): Promise<ISaleResponse> {
    const layawaySales = await this.salesRepo.findOne({
      where: { external_id: dto.sale_ext_id.trim(), type: 'L' },
    });

    if (!layawaySales) {
      throw new NotFoundException({
        status: {
          success: false,
          message:
            'Sales transaction not found or sale was not tagged as Layaway',
        },
      });
    }
    if (layawaySales.status === 'Fully paid') {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Sales transaction status is Fully Paid',
        },
      });
    }
    if (layawaySales.status === 'Cancelled') {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Sales transaction status is Cancelled',
        },
      });
    }
    let paymentLogsArray = await this.paymentLogsRepo.find({
      where: { sale_ext_id: layawaySales.external_id.trim() },
      order: { payment_date: 'DESC' },
    });

    const salesLayawayDetails = await this.saleLayawaysRepo.findOne({
      where: { sale_ext_id: layawaySales.external_id.trim() },
    });

    // Calculate total paid amount
    let totalPaidAmount = paymentLogsArray.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // Determine base amount (depends on sale type)
    let baseAmount = Number(layawaySales.total_amount);

    // Calculate outstanding balance (never negative)
    let outstandingBalance = Math.max(baseAmount - totalPaidAmount, 0).toFixed(
      2,
    );

    if (Number(outstandingBalance) <= 0) {
      layawaySales.status = 'Fully paid';
      await this.salesRepo.save(layawaySales);

      if (salesLayawayDetails) {
        salesLayawayDetails.amount_due = 0;
        salesLayawayDetails.payment_date = paymentLogsArray[0].payment_date;
        salesLayawayDetails.status = 'Paid';
        await this.saleLayawaysRepo.save(salesLayawayDetails);
      }

      throw new BadRequestException({
        status: {
          success: false,
          message: 'No outstanding balance',
        },
      });
    }

    //Record payment
    if (
      Number(dto.payment.amount.replace(/,/g, '')) > Number(outstandingBalance)
    ) {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Payment amount is greater than the outstanding balance',
        },
      });
    }

    const payment_ext_id = `P-${generateUniqueId(10)}`;
    const isDeposit =
      Number(dto.payment.amount.replace(/,/g, '')) < Number(outstandingBalance);
    const isFinalPayment =
      Number(dto.payment.amount.replace(/,/g, '')) ===
      Number(outstandingBalance);

    const paymentLog = this.paymentLogsRepo.create({
      external_id: payment_ext_id,
      sale_ext_id: layawaySales.external_id.trim(),
      amount: Number(dto.payment.amount.replace(/,/g, '')),
      payment_date: dto.payment.payment_date,
      payment_method: dto.payment.payment_method,
      is_deposit: isDeposit,
      is_final_payment: isFinalPayment,
      created_by: dto.created_by,
    });

    await this.paymentLogsRepo.save(paymentLog);

    if (isDeposit) {
      // Recalculate total paid amount
      paymentLogsArray = await this.paymentLogsRepo.find({
        where: { sale_ext_id: layawaySales.external_id.trim() },
        order: { payment_date: 'DESC' },
      });

      totalPaidAmount = paymentLogsArray.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );

      // Redetermine base amount (depends on sale type)
      baseAmount = Number(layawaySales.total_amount);

      // Recalculate outstanding balance (never negative)
      outstandingBalance = Math.max(baseAmount - totalPaidAmount, 0).toFixed(2);

      if (salesLayawayDetails) {
        salesLayawayDetails.amount_due = Number(outstandingBalance);
        await this.saleLayawaysRepo.save(salesLayawayDetails);
      }
    }

    if (isFinalPayment) {
      layawaySales.status = 'Fully paid';
      await this.salesRepo.save(layawaySales);

      if (salesLayawayDetails) {
        salesLayawayDetails.amount_due = 0;
        salesLayawayDetails.payment_date = paymentLogsArray[0].payment_date;
        salesLayawayDetails.status = 'Paid';
        await this.saleLayawaysRepo.save(salesLayawayDetails);
      }
    }

    return await this.findOne(layawaySales.external_id);
  }

  async cancelSales(dto: CancelSaleDto): Promise<ISaleResponse> {
    const sales = await this.salesRepo.findOne({
      where: { external_id: dto.sale_ext_id.trim(), status: Not('Cancelled') },
    });

    if (!sales) {
      throw new NotFoundException({
        status: {
          success: false,
          message:
            'Sales transaction not found or sale was already tagged as Cancelled',
        },
      });
    }
    const salesItems = await this.salesItemsRepo.find({
      where: { sale_ext_id: sales.external_id.trim() },
    });

    if (!salesItems || salesItems.length === 0) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Sold products not found',
        },
      });
    }

    sales.status = 'Cancelled';
    sales.cancelled_by = dto.cancelled_by;
    sales.cancelled_at = new Date();

    for (const item of salesItems) {
      await this.productService.updateStockFromSale(item.product_ext_id, {
        type: 'cancel',
        qty: item.qty,
        updated_by: dto.cancelled_by,
      });
    }

    await this.salesRepo.save(sales);

    return {
      status: {
        success: true,
        message: 'Sale has been successfully cancelled',
      },
    };
  }

  async extendLayawayDueDate(
    external_id: string,
    dto: ExtendLayawayDueDateDto,
  ): Promise<ISaleResponse> {
    const layawaySales = await this.salesRepo.findOne({
      where: { external_id: external_id.trim(), type: 'L' },
    });

    if (!layawaySales) {
      throw new NotFoundException({
        status: {
          success: false,
          message:
            'Sales transaction not found or sale was not tagged as Layaway',
        },
      });
    }
    if (layawaySales.status === 'Fully paid') {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Sales transaction status is Fully Paid',
        },
      });
    }
    if (layawaySales.status === 'Cancelled') {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Sales transaction status is Cancelled',
        },
      });
    }

    const salesLayawayDetails = await this.saleLayawaysRepo.findOne({
      where: { sale_ext_id: layawaySales.external_id.trim() },
    });

    if (!salesLayawayDetails) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Sales layaway transaction not found',
        },
      });
    }

    const currentDueDate = new Date(salesLayawayDetails.current_due_date);
    const newDueDate = new Date(dto.due_date);

    if (newDueDate <= currentDueDate) {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Extended due date must be later than the current due date',
        },
      });
    }

    salesLayawayDetails.current_due_date = newDueDate;
    salesLayawayDetails.is_extended = true;
    salesLayawayDetails.updated_at = new Date();
    salesLayawayDetails.updated_by = dto.updated_by;

    await this.saleLayawaysRepo.save(salesLayawayDetails);

    return await this.findOne(salesLayawayDetails.sale_ext_id.trim());
  }

  async validateProducts(
    products: { product_ext_id: string; qty?: number }[],
    mode: 'create' | 'read' = 'create',
  ): Promise<IProduct[]> {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const insufficientStock: string[] = [];
    const notFoundProducts: string[] = [];
    const validatedProducts: IProduct[] = [];

    for (const item of products) {
      const trimmedId = item.product_ext_id.trim();

      if (mode === 'create') {
        // Check duplicate
        if (seen.has(trimmedId)) {
          duplicates.push(trimmedId);
          continue;
        }
        seen.add(trimmedId);
      }

      // Fetch product
      const productData = await this.productService
        .findOne(trimmedId)
        .then((res) => res?.data ?? null);

      if (!productData) {
        notFoundProducts.push(trimmedId);
        continue;
      }

      if (mode === 'create') {
        // Check quantity only in create mode
        if (item.qty > productData.stock.qty_in_stock) {
          insufficientStock.push(
            `${trimmedId} (requested: ${item.qty}, available: ${productData.stock.qty_in_stock})`,
          );
        }
      }

      validatedProducts.push(productData);
    }

    if (mode === 'create') {
      if (duplicates.length > 0) {
        throw new BadRequestException(
          `Duplicate product_ext_id(s) found: ${duplicates.join(', ')}`,
        );
      }

      if (insufficientStock.length > 0) {
        throw new BadRequestException(
          `Insufficient stock for product(s): ${insufficientStock.join(', ')}`,
        );
      }
    }

    if (notFoundProducts.length > 0) {
      throw new NotFoundException(
        `Product(s) not found: ${notFoundProducts.join(', ')}`,
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
    // Utility to compare dates by day only (ignores time)
    const isDateBeforeToday = (date: Date): boolean => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // zero out time

      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0); // zero out time

      return compareDate < today;
    };

    // Ensure paymentLogs is an array
    const paymentLogsArray: PaymentLogs[] = Array.isArray(paymentLogs)
      ? paymentLogs
      : paymentLogs
        ? [paymentLogs]
        : [];

    // Map sale items to IProductUnit[]
    const productUnits: IProductUnit[] = saleItems.map((item) => {
      const product = productsData.find(
        (p) => p.stock_external_id === item.product_ext_id,
      );

      return {
        external_id: item.product_ext_id,
        name: product?.name ?? '',
        code: product?.code ?? '',
        inclusions: product?.inclusions ?? [],
        is_consigned: product?.is_consigned ?? false,
        unit_price: Number(item.unit_price).toFixed(2),
        qty: item.qty,
        subtotal: Number(item.subtotal).toFixed(2),
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
            is_overdue: isDateBeforeToday(
              new Date(layawayPlan.current_due_date),
            ),
            no_of_months: layawayPlan.no_of_months.toString(),
            amount_due: Number(layawayPlan.amount_due).toFixed(2),
            current_due_date: new Date(layawayPlan.current_due_date),
            orig_due_date: new Date(layawayPlan.orig_due_date),
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
      images: saleEntity.images,
      created_at: saleEntity.created_at,
      created_by: saleEntity.created_by,
      cancelled_at: saleEntity.cancelled_at ?? null,
      cancelled_by: saleEntity.cancelled_by ?? null,
    };
  }

  async getSalesStats(
    mode: 'A' | 'CN' | 'R' | 'L',
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ISaleTransactionsResponse> {
    const statuses = ['Fully paid', 'Deposit', 'Cancelled'];
    const data: Partial<ISaleTransactionsResponse['data']> = {}; // Partial<ISaleTransactionsResponse['data']>

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const validateDateRange = () => {
      let fromDate: Date | undefined;
      let toDate: Date | undefined;

      if (dateFrom) {
        fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
          throw new BadRequestException({
            status: {
              success: false,
              message: 'Invalid dateFrom format. Please use YYYY-MM-DD.',
            },
          });
        }
      }

      if (dateTo) {
        toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
          throw new BadRequestException({
            status: {
              success: false,
              message: 'Invalid dateTo format. Please use YYYY-MM-DD.',
            },
          });
        }
      }

      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException({
          status: {
            success: false,
            message: '`dateFrom` must not be after `dateTo`.',
          },
        });
      }

      return { fromDate, toDate };
    };

    const { fromDate, toDate } = validateDateRange();

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const buildDateCondition = () => {
      if (fromDate && toDate) {
        return { start: fromDate, end: toDate };
      } else if (fromDate) {
        return { start: fromDate };
      } else if (toDate) {
        return { end: toDate };
      }
      return {};
    };

    const buildQuery = (
      status: string,
      dateCondition: { start?: Date; end?: Date } = {},
    ): Promise<{ totalAmount?: string; totalCount?: string }> => {
      let query = null;

      if (status === 'Deposit') {
        query = this.salesRepo
          .createQueryBuilder('s')
          .leftJoin('payment_logs', 'pl', 'pl.sale_ext_id = s.external_id')
          .select(
            'SUM(s.total_amount) - COALESCE(SUM(pl.amount), 0)',
            'totalAmount',
          )
          .addSelect('COUNT(*)', 'totalCount')
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

      if (dateCondition.start && dateCondition.end) {
        query.andWhere('s.date_purchased BETWEEN :start AND :end', {
          start: dateCondition.start.toISOString(),
          end: dateCondition.end.toISOString(),
        });
      } else if (dateCondition.start) {
        query.andWhere('s.date_purchased >= :start', {
          start: dateCondition.start.toISOString(),
        });
      } else if (dateCondition.end) {
        query.andWhere('s.date_purchased <= :end', {
          end: dateCondition.end.toISOString(),
        });
      }

      return query.getRawOne();
    };

    const formatKey = (
      status: string,
    ): keyof ISaleTransactionsResponse['data'] => {
      if (status === 'Fully paid') return 'totalPaidSales';
      if (status === 'Deposit') return 'totalPendingSales';
      if (status === 'Cancelled') return 'totalCancelledSales';
      throw new Error(`Unexpected status: ${status}`);
    };

    const dateCondition = buildDateCondition();

    if (dateFrom || dateTo) {
      // return only the date range results
      for (const status of statuses) {
        const result = await buildQuery(status, dateCondition);

        data[formatKey(status)] = {
          totalAmount: result?.totalAmount || '0',
          totalCount: result?.totalCount || '0',
        };
      }

      return {
        status: {
          success: true,
          message: 'Successfully fetched data',
        },
        data: {
          dataRange: {
            from: fromDate ? fromDate.toISOString().split('T')[0] : null,
            to: toDate ? toDate.toISOString().split('T')[0] : null,
          },
          ...data,
        },
      };
    }

    // Default: no date range provided — return full stats
    const now = new Date();
    const todayStart = new Date(now.toDateString());

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const lastWeekStart = new Date(todayStart);
    lastWeekStart.setDate(todayStart.getDate() - 7);

    const lastMonthStart = new Date(todayStart);
    lastMonthStart.setMonth(todayStart.getMonth() - 1);

    const lastYearStart = new Date(todayStart);
    lastYearStart.setFullYear(todayStart.getFullYear() - 1);

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const buildFullStatsQuery = (status: string) => {
      let query = null;

      if (status === 'Deposit') {
        query = this.salesRepo
          .createQueryBuilder('s')
          .leftJoin('payment_logs', 'pl', 'pl.sale_ext_id = s.external_id')
          .select(
            'SUM(s.total_amount) - COALESCE(SUM(pl.amount), 0)',
            'totalAmount',
          )
          .addSelect('COUNT(*)', 'totalCount')
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

      return query.getRawOne();
    };

    for (const status of statuses) {
      const total = await buildFullStatsQuery(status);
      const today = await buildQuery(status, { start: todayStart });
      const yesterday = await buildQuery(status, {
        start: yesterdayStart,
        end: todayStart,
      });
      const lastWeek = await buildQuery(status, { start: lastWeekStart });
      const lastMonth = await buildQuery(status, { start: lastMonthStart });
      const lastYear = await buildQuery(status, { start: lastYearStart });

      data[formatKey(status)] = {
        totalAmount: total?.totalAmount || '0',
        totalCount: total?.totalCount || '0',
        todayAmount: today?.totalAmount || '0',
        todayCount: today?.totalCount || '0',
        yesterdayAmount: yesterday?.totalAmount || '0',
        yesterdayCount: yesterday?.totalCount || '0',
        lastWeekAmount: lastWeek?.totalAmount || '0',
        lastWeekCount: lastWeek?.totalCount || '0',
        lastMonthAmount: lastMonth?.totalAmount || '0',
        lastMonthCount: lastMonth?.totalCount || '0',
        lastYearAmount: lastYear?.totalAmount || '0',
        lastYearCount: lastYear?.totalCount || '0',
      };
    }

    return {
      status: {
        success: true,
        message: 'Successfully fetched data',
      },
      data: data as ISaleTransactionsResponse['data'],
    };
  }

  async getCustomerPurchaseFrequencyV1(
    dto: CustomerPurchaseFrequencyDto,
  ): Promise<CustomerFrequencyResponse> {
    const { dateFrom, dateTo } = dto;

    const buildMetrics = async (
      from: Date,
      to: Date,
    ): Promise<CustomerFrequencyResult> => {
      const allSales = await this.salesRepo
        .createQueryBuilder('sales')
        .select(['sales.client_ext_id'])
        .addSelect('COUNT(*)', 'orders')
        .where('sales.status = :status', { status: 'Fully paid' })
        .andWhere('sales.date_purchased BETWEEN :from AND :to', { from, to })
        .groupBy('sales.client_ext_id')
        .getRawMany();

      const newCustomers = allSales.filter((s) => +s.orders === 1).length;
      const repeatCustomers = allSales.filter((s) => +s.orders > 1).length;
      const topRepeatCustomers = allSales
        .filter((s) => +s.orders > 1)
        .sort((a, b) => +b.orders - +a.orders)
        .slice(0, 5)
        .map((s) => ({
          customerId: s.sales_client_ext_id,
          customerName: `${s.sales_client_ext_id}`,
          orders: +s.orders,
        }));

      return { newCustomers, repeatCustomers, topRepeatCustomers };
    };

    const result: CustomerFrequencyResponse = {};

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      result.dataRange = { from: dateFrom, to: dateTo };
      result.customRange = await buildMetrics(from, to);
    } else {
      const now = new Date();

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const startOf = (unit: 'month' | 'year', offset = 0) => {
        const d = new Date();
        if (unit === 'month') {
          d.setMonth(d.getMonth() + offset, 1);
        } else {
          d.setFullYear(d.getFullYear() + offset, 0, 1);
        }
        d.setHours(0, 0, 0, 0);
        return d;
      };

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const endOf = (unit: 'month' | 'year', offset = 0) => {
        const d = new Date();
        if (unit === 'month') {
          d.setMonth(d.getMonth() + offset + 1, 0);
        } else {
          d.setFullYear(d.getFullYear() + offset + 1, 0, 0);
        }
        d.setHours(23, 59, 59, 999);
        return d;
      };

      result.thisMonth = await buildMetrics(startOf('month'), endOf('month'));
      result.lastMonth = await buildMetrics(
        startOf('month', -1),
        endOf('month', -1),
      );

      const last6MonthsStart = new Date(now);
      last6MonthsStart.setMonth(now.getMonth() - 6);
      result.last6mos = await buildMetrics(last6MonthsStart, now);

      result.lastYear = await buildMetrics(
        startOf('year', -1),
        endOf('year', -1),
      );
    }

    return result;
  }

  async getCustomerPurchaseFrequency(
    dto: CustomerPurchaseFrequencyDto,
  ): Promise<CustomerFrequencyResponse> {
    const { dateFrom, dateTo } = dto;

    const buildMetrics = async (
      from: Date,
      to: Date,
    ): Promise<CustomerFrequencyResult> => {
      const allSales = await this.salesRepo
        .createQueryBuilder('sales')
        .select('sales.client_ext_id', 'clientId')
        .addSelect('COUNT(*)', 'orders')
        .addSelect(
          `CONCAT(client.first_name, ' ', client.last_name)`,
          'customerName',
        )
        .leftJoin(
          'clients',
          'client',
          'client.external_id = sales.client_ext_id',
        )
        .where('sales.status = :status', { status: 'Fully paid' })
        .andWhere('sales.date_purchased BETWEEN :from AND :to', { from, to })
        .groupBy('sales.client_ext_id')
        .addGroupBy('client.first_name')
        .addGroupBy('client.last_name')
        .getRawMany();

      const newCustomers = allSales.filter((s) => +s.orders === 1).length;
      const repeatCustomers = allSales.filter((s) => +s.orders > 1).length;
      const topRepeatCustomers = allSales
        .filter((s) => +s.orders > 1)
        .sort((a, b) => +b.orders - +a.orders)
        .slice(0, 5)
        .map((s) => ({
          customerId: s.clientId,
          customerName: s.customerName ?? s.clientId,
          orders: +s.orders,
        }));

      return { newCustomers, repeatCustomers, topRepeatCustomers };
    };

    const result: CustomerFrequencyResponse = {};

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      result.dataRange = { from: dateFrom, to: dateTo };
      result.customRange = await buildMetrics(from, to);
    } else {
      const now = new Date();

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const startOf = (unit: 'month' | 'year', offset = 0) => {
        const d = new Date();
        if (unit === 'month') {
          d.setMonth(d.getMonth() + offset, 1);
        } else {
          d.setFullYear(d.getFullYear() + offset, 0, 1);
        }
        d.setHours(0, 0, 0, 0);
        return d;
      };

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const endOf = (unit: 'month' | 'year', offset = 0) => {
        const d = new Date();
        if (unit === 'month') {
          d.setMonth(d.getMonth() + offset + 1, 0);
        } else {
          d.setFullYear(d.getFullYear() + offset + 1, 0, 0);
        }
        d.setHours(23, 59, 59, 999);
        return d;
      };

      result.thisMonth = await buildMetrics(startOf('month'), endOf('month'));
      result.lastMonth = await buildMetrics(
        startOf('month', -1),
        endOf('month', -1),
      );

      const last6MonthsStart = new Date(now);
      last6MonthsStart.setMonth(now.getMonth() - 6);
      result.last6mos = await buildMetrics(last6MonthsStart, now);

      result.lastYear = await buildMetrics(
        startOf('year', -1),
        endOf('year', -1),
      );
    }

    return result;
  }
}
