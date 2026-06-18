import { useSession } from "next-auth/react";
import { useLandlordContext } from "@/app/store/useLandlordContext";
import Axios from "@/config/axios.config";
import { AxiosRequestConfig } from "axios";

export const useAgentAxios = () => {
  const { data: session } = useSession();
  const { selectedLandlord } = useLandlordContext();

  const agentAxios = {
    get: (url: string, config?: AxiosRequestConfig) => {
      
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      // Add landlord context header if agent is acting as landlord
      if (session?.role === "agent" && selectedLandlord) {
        headers["X-Acting-As-Landlord"] = selectedLandlord.id.toString();
      }

      return Axios.get(url, { ...config, headers });
    },

  post: (url: string, data?: any, config?: AxiosRequestConfig) => {
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      // If sending FormData, do NOT set Content-Type; let browser add proper boundary
      if (typeof FormData !== 'undefined' && data instanceof FormData) {
        if (headers['Content-Type'] || headers['content-type']) {
          delete headers['Content-Type'];
          delete headers['content-type'];
        }
      }

      // Add landlord context header if agent is acting as landlord
      if (session?.role === "agent" && selectedLandlord) {
        headers["X-Acting-As-Landlord"] = selectedLandlord.id.toString();
      }

      return Axios.post(url, data, { ...config, headers });
    },

  put: (url: string, data?: any, config?: AxiosRequestConfig) => {
      
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      // If sending FormData, do NOT set Content-Type; let browser add proper boundary
      if (typeof FormData !== 'undefined' && data instanceof FormData) {
        if (headers['Content-Type'] || headers['content-type']) {
          delete headers['Content-Type'];
          delete headers['content-type'];
        }
      }

      // Add landlord context header if agent is acting as landlord
      if (session?.role === "agent" && selectedLandlord) {
        headers["X-Acting-As-Landlord"] = selectedLandlord.id.toString();
      }

      return Axios.put(url, data, { ...config, headers });
    },

    patch: (url: string, data?: any, config?: AxiosRequestConfig) => {
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      // Add landlord context header if agent is acting as landlord
      if (session?.role === "agent" && selectedLandlord) {
        headers["X-Acting-As-Landlord"] = selectedLandlord.id.toString();
      }

      return Axios.patch(url, data, { ...config, headers });
    },

    delete: (url: string, config?: AxiosRequestConfig) => {
      const headers: any = {
        ...config?.headers,
        Authorization: `Bearer ${session?.access}`,
      };

      // Add landlord context header if agent is acting as landlord
      if (session?.role === "agent" && selectedLandlord) {
        headers["X-Acting-As-Landlord"] = selectedLandlord.id.toString();
      }

      return Axios.delete(url, { ...config, headers });
    },
  };

  return agentAxios;
};
