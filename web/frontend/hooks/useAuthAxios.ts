import { useSession } from "next-auth/react";
import Axios from "@/config/axios.config";
import { AxiosRequestConfig } from "axios";

export const useAuthAxios = () => {
  const { data: session } = useSession();

  const authAxios = {
    get: (url: string, config?: AxiosRequestConfig) => {
      
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      return Axios.get(url, { ...config, headers });
    },

    post: (url: string, data?: any, config?: AxiosRequestConfig) => {
      
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      return Axios.post(url, data, { ...config, headers });
    },

    put: (url: string, data?: any, config?: AxiosRequestConfig) => {
      
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      return Axios.put(url, data, { ...config, headers });
    },

    patch: (url: string, data?: any, config?: AxiosRequestConfig) => {
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      return Axios.patch(url, data, { ...config, headers });
    },

    delete: (url: string, config?: AxiosRequestConfig) => {
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      return Axios.delete(url, { ...config, headers });
    },
  };

  return authAxios;
};