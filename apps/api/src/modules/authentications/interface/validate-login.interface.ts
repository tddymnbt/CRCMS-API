import { IUser } from 'src/modules/users/interface/user.interface';
import { ITokenResponse } from './token-response.interface';

export interface IValidateLoginResponse {
  status: {
    success: boolean;
    message: string;
  };
  access?: ITokenResponse;
  data?: IUser;
}
