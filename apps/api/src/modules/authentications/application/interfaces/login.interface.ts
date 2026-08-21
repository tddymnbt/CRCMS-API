export interface ILoginResponse {
  status: {
    success: boolean;
    message: string;
    token: string;
  };
}
