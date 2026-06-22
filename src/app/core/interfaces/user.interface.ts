import { IBaseEntity } from "./base-entity.interface";

export interface IUser extends IBaseEntity {
  name: string;
  email: string;
  role: UserRole;
  phoneNumber:string;
  avatar?: string;
  isActive?: boolean;
}

export type UserRole = 'agent' | 'admin' | 'buyer' | 'seller';

