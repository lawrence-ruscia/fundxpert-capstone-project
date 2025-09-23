export type UserResponse = {
  user: UserType;
};

export type UserType = {
  id: number;
  name: string;
  role: 'Employee' | 'HR' | 'Admin';
};

export type TwoFALoginResponse =
  | {
      twofaRequired: boolean;
      userId: number;
    }
  | { twofaSetupRequired: boolean; userId: number };

export type LoginResponse = UserResponse | TwoFALoginResponse;
