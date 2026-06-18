import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    access: string;
    refresh: string;
    role: string;
    user: {
      id: string;
      email: string;
      name?: string;
      profile?: {
        status: string;
        phone: string;
        // Add other profile fields as needed
      };
    };
  }
}