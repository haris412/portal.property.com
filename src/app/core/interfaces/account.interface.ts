// export interface IAccountLoginRequest {
//   email: string;
//   password: string;
// }

// export interface ITokenResponse {
//   accessToken: string;
// }

// export interface IAccountForgotPassword {
//   email: string;
// }

// export interface IAccountResetPassword {
//   emailEncoded: string;
//   tokenEncoded: string;
//   password: string;
//   confirmPassword: string;
// }

// export interface IAccountUpdateRequest {
//   salutation: string;
//   firstName: string;
//   lastName: string;
//   email: string;
// //   language: ELanguage;
// //   avatar: IMediaFile | null;
// }

export interface IAccountSignUp {
  email: string;
  password: string;
  phoneNumber:string;
  location:string;
  name:string;
  agencyName?:string;
  agree:boolean;
  role:string;
}

// export interface IInvitationTokenVerification {
//   isValid: boolean;
//   resetPasswordTokenEncoded: string;
// }
