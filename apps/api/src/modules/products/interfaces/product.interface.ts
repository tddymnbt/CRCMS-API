import { IClient } from 'src/modules/clients/interface/client-response.interface';
import { IProductMisc } from './p-misc.interface';

export interface IProductResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IProduct;
}
export interface IProductsResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IProduct[];
  meta?: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

export interface IProduct {
  external_id: string;
  category: {
    code: string;
    name: string;
  };
  brand: {
    code: string;
    name: string;
  };
  name: string;
  material: string;
  hardware: string;
  code: string;
  measurement: string;
  model: string;
  authenticator: {
    code: string;
    name: string;
  };
  inclusions: string[];
  images: string[];
  condition: {
    interior: number;
    exterior: number;
    overall: number;
    description?: string;
  };
  cost: number;
  price: number;
  stock: {
    min_qty: number;
    qty_in_stock: number;
    sold_stock: number;
  };
  is_consigned: boolean;
  consignor: {
    code: string;
    first_name: string;
    last_name: string;
  };
  consignor_selling_price: number;
  consigned_date: Date;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
}

export interface IPMiscsResponse {
  category_data?: IProductMisc;
  brand_data?: IProductMisc;
  authenticator_data?: IProductMisc;
  consignor_data?: IClient;
}
