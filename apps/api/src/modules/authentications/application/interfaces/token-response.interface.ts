export interface ITokenResponse {
  token: string;
  tokenExpiry: string;
}

export interface IAuthEntry {
  created_by: string;
  is_active: boolean;
  token: string;
  token_expiry: string;
  user_ext_id: string;
  token_jti: string;
}
