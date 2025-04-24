export interface IUserResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IUser;
}
export interface IUsersResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IUser[];
  meta?: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

export interface IUser {
  id: number;
  external_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
  last_login?: string;
}


