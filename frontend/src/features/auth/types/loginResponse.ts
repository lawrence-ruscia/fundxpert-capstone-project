import type { HRRole } from '@/shared/types/user';

export type UserResponse = {
  user: UserType;
  tokenExpiry: number;
};

export type UserType = {
  id: number;
  name: string;
  role: 'Employee' | 'HR' | 'Admin';
  hr_role?: HRRole;
};

export type TwoFALoginResponse =
  | {
      twofaRequired: boolean;
      userId: number;
    }
  | { twofaSetupRequired: boolean; userId: number };

export type TempPassLoginResponse = {
  forcePasswordChange: boolean;
  userId: number;
};

export type LoginResponse =
  | UserResponse
  | TwoFALoginResponse
  | TempPassLoginResponse;
