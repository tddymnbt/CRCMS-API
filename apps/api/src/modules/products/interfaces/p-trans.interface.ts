export interface IProductTransactionsResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IProductTransaction[];
  meta?: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

export interface IProductTransaction {
  stock_id: string;
  product_id: string;
  type: string;
  source: string;
  qty_before: number;
  change: number;
  qty_after: number;
  status: string;
  performed_by: string;
}
