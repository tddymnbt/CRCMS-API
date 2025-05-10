
export interface IProductCategoryResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IProductCategory;
}
export interface IProductCategoriesResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IProductCategory[];
  meta?: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

export interface IProductCategory {
  external_id: string;
  name: string;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
}