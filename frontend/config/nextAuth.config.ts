import { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import Axios from "./axios.config";
import { AxiosError } from "axios";
import { FormError } from "@/types/errorTypes";
import { CustomUser } from "@/types/nextauth";

async function refreshToken(token: JWT): Promise<JWT> {
  try {
    const res = await Axios.post("/auth/token/refresh/", {
      refresh: token.refresh,
    });
    console.log("refreshed");
    const newAccess = res.data.access;

    const expiresAt = new Date(Date.now() + 59 * 60 * 1000).toISOString();

    return {
      ...token,
      access: newAccess,
      expiresAt,
    };
  } catch (error: any) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Failed to refresh token";

    console.log(message);

    // IMPORTANT: This file is used by NextAuth on the server as well as the client.
    // Never call next-auth/react (client-only) helpers like signOut() from here.
    // Instead, attach an error so the client can react (e.g. sign out) safely.
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "local-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const res = await Axios.post("/auth/login/", {
            email: credentials?.email,
            password: credentials?.password,
          });

          return res.data.userData as User;
        } catch (error) {
          if ((error as AxiosError<FormError>).response) {
            const errorData = (error as AxiosError<FormError>).response?.data;
            throw Error(errorData?.message);
          } else {
            throw Error("Something went wrong!");
          }
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      const customUser = user as unknown as CustomUser;
      if (user)
        return {
          ...token,
          ...customUser,
        };

      // If refresh already failed, keep returning the errored token.
      if (token.error) {
        return token;
      }

      if (token.expiresAt && new Date(token.expiresAt).getTime() > new Date().getTime()) {
        return token;
      }

      return await refreshToken(token);
    },

    async session({ token, session }) {
      session = { ...session, ...token };

      return session;
    },
  },
};
