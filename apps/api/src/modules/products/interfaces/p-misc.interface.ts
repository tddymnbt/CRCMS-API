
export interface IProductMiscResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IProductMisc;
}
export interface IProductMiscsResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IProductMisc[];
  meta?: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

export interface IProductMisc{
  external_id: string;
  name: string;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
}