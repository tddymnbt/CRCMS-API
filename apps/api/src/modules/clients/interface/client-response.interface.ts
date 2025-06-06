export interface IClientBankDetails {
  account_name: string;
  account_no: string;
  bank?: string;
}

export interface IClientResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IClient;
}
export interface IClientsResponse {
  status: {
    success: boolean;
    message: string;
  };
  data?: IClient[];
  meta?: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}

export interface IClient {
  external_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  birth_date: Date;
  email: string;
  contact_no?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  is_consignor: boolean;
  is_active: boolean;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
  bank?: IClientBankDetails;
}

export interface IClientCount {
  status: {
    success: boolean;
    message: string;
  };
  data: {
    totalCount: string;
    todayCount: string;
    yesterdayCount: string;
    lastWeekCount: string;
    lastMonthCount: string;
    lastYearCount: string;
  };
}
