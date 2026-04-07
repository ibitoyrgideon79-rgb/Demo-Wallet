export interface AuthenticatedRequestUser {
  userId: string;
}

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bvn: string;
}

export interface LoginInput {
  email: string;
  bvn: string;
}
