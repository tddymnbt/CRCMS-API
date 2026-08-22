export interface ITokenResponse {
  token: string;
  tokenExpiry: string;
}

export interface IRefreshTokenResponse {
  refresh_token: string;
  refresh_token_expiry: string;
}

export interface IAuthEntry {
  created_by: string;
  is_active: boolean;
  token: string;
  token_expiry: string;
  user_ext_id: string;
  token_jti: string;
}
