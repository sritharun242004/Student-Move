import NextAuth from "next-auth";

export type Role = "tenant" | "landlord" | "admin" | "agent" | "merchant";

declare module "next-auth" {
  interface Session {
    id: number | string;
    email: string;
    firstName: string;
    lastName: string;
    access: string;
    refresh: string;
    profile: {
      status: string;
      phone: string;
    };
    role: Role;
    expiresAt: number | string;
  }
}

import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id: number | string;
    email: string;
    firstName: string;
    lastName: string;
    profile: {
      status: string;
      phone: string;
    };
    access: string;
    refresh: string;
    role: Role;
    expiresAt: number | string;
  }
}

export interface CustomUser {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  profile: {
    status: string;
    phone: string;
  };
  access: string;
  refresh: string;
  role: Role;
  expiresAt?: string;
}
