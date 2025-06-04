import { IClient } from 'src/modules/clients/interface/client-response.interface';
import { IProduct } from 'src/modules/products/interfaces/product.interface';

export interface ISaleResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: ISale;
}
export interface ISalesResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: ISale[];
  meta?: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

export interface ISale {
  sale_external_id: string;
  date_purchased: Date;
  Customer: {
    external_id: string;
    name: string;
  };
  type: {
    code: string;
    description: string;
  };
  layaway_plan?: {
    is_overdue: boolean;
    no_of_months: string;
    amount_due: string;
    current_due_date: Date;
    orig_due_date: Date;
    is_extended: boolean;
    status: string;
  };
  product: IProductUnit[];
  total_amount: string;
  outstanding_balance: string;
  is_discounted: boolean;
  discount_percent: string;
  discount_flat_rate: string;
  status: string;
  payment_history: IPaymentHistory[];
  images: string[];
  created_at: Date;
  created_by: string;
  cancelled_at: Date;
  cancelled_by: string;
}

export interface IProductUnit {
  external_id: string;
  name: string;
  is_consigned: boolean;
  unit_price: string;
  qty: number;
  subtotal: string;
}

export interface IPaymentHistory {
  external_id: string;
  amount: string;
  payment_date: Date;
  payment_method: string;
}

export interface ISMiscsResponse {
  product_Data?: IProduct;
  client_data?: IClient;
}
