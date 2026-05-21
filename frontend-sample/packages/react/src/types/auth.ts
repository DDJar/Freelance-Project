export interface User {
  id: string;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  phoneNumber: string;
  address: string;
  gender: string;
  position: string;
  departmentId: string;
  departmentName?: string; // Tên phòng ban
  email: string;
  role: string;
  status: string;
  country: string;
  city: string;
  hiredDate: Date; 
  birthDate: Date; 
  avatarUrl?: string;
  phone?: string; // Alias for phoneNumber
  image?: string; // Alias for avatarUrl
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserReference {
  id: string;
  username: string;
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
}


export type AuthContextType = {
  user?: User;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    isOk: boolean;
    data?: {
      user: User;
      accessToken: string;
    };
    message?: string;
  }>;
  signOut: () => void;
};
