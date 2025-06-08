export interface ActivityLogItem {
  id: number;
  user_ext_id: string;
  module?: string;
  action?: string;
  description?: string;
  ref_id?: string;
  created_at: Date;
}

export interface AuditLogsResponse {
  status: {
    success: boolean;
    message: string;
  };
  data: ActivityLogItem[];
  meta: {
    page: number;
    totalNumber: number;
    totalPages: number;
    displayPage: number;
  };
}
