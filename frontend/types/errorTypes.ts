export type FormError = {
  success: boolean;
  message: string;
  statusCode: number;
  field:
    | "name"
    | "email"
    | "password"
    | "rePassword"
    | "root"
    | "root.{string}";
};
