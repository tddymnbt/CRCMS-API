// interfaces/client-response.interface.ts
export interface IClientResponse {
  id: number;
  external_id: string;
  full_name: string;
  email: string;
  is_consignor: boolean;
  is_active: boolean;
  created_at: Date;
}
