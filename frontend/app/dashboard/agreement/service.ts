import agentAxios from "@/config/axios.config";
import { AgreementDetails, AgreementFormData } from "./schemas";

type AgentAxiosType = {
  get: (url: string, config?: any) => Promise<any>;
  post: (url: string, data?: any, config?: any) => Promise<any>;
  put: (url: string, data?: any, config?: any) => Promise<any>;
  patch: (url: string, data?: any, config?: any) => Promise<any>;
  delete: (url: string, config?: any) => Promise<any>;
};

export class AgreementService {
  static async getAgreementForm(formId: string, axiosInstance: AgentAxiosType = agentAxios) {
    const response = await axiosInstance.get(`/forms/${formId}/agreement/`);
    return response.data;
  }

  static async saveAgreementDetails(
    applicationId: string,
    data: any,
    axiosInstance: AgentAxiosType = agentAxios
  ) {
    const response = await axiosInstance.post(
      `/forms/${applicationId}/agreement/add-details`,
      data
    );
    return response.data;
  }

  static async updateAgreementDetails(
    applicationId: string,
    data: any,
    axiosInstance: AgentAxiosType = agentAxios
  ) {
    const response = await axiosInstance.put(
      `/forms/${applicationId}/agreement/add-details`,
      data
    );
    return response.data;
  }

  static async saveLandlordSignature(applicationId: string, data: FormData, axiosInstance: AgentAxiosType = agentAxios) {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await axiosInstance.post(
      `/forms/${applicationId}/agreement/landlord-signature/`,
      data
    );
    return response.data;
  }

  static async saveLandlordSignature1(applicationId: string, data: FormData, axiosInstance: AgentAxiosType = agentAxios) {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await axiosInstance.post(
      `/forms/${applicationId}/agreement/landlord-signature-1/`,
      data
    );
    return response.data;
  }

  static async saveTenantSignature(applicationId: string, data: FormData, axiosInstance: AgentAxiosType = agentAxios) {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const url = `/forms/${applicationId}/agreement/tenant-signature/`;
    console.log('Calling saveTenantSignature with URL:', url, 'applicationId:', applicationId);
    const response = await axiosInstance.post(
      url,
      data
    );
    return response.data;
  }

  static async saveTenantSignature1(applicationId: string, data: FormData, axiosInstance: AgentAxiosType = agentAxios) {
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const url = `/forms/${applicationId}/agreement/tenant-signature-1/`;
    console.log('Calling saveTenantSignature1 with URL:', url, 'applicationId:', applicationId);
    const response = await axiosInstance.post(
      url,
      data
    );
    return response.data;
  }

  static async saveAdminSignature(applicationId: string, data: FormData, adminName: string, axiosInstance: AgentAxiosType = agentAxios) {
    // Add admin_name to the FormData
    data.append('admin_name', adminName);
    
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await axiosInstance.post(
      `/forms/${applicationId}/agreement/admin-signature/`,
      data
    );
    return response.data;
  }

  static async saveAdminSignature1(applicationId: string, data: FormData, adminName: string, axiosInstance: AgentAxiosType = agentAxios) {
    // Add admin_name to the FormData
    data.append('admin_name', adminName);
    
    // Do NOT set Content-Type manually; let the browser set the multipart boundary
    const response = await axiosInstance.post(
      `/forms/${applicationId}/agreement/admin-signature-1/`,
      data
    );
    return response.data;
  }

  static async addTenantSign(applicationId: string, data: any, axiosInstance: AgentAxiosType = agentAxios) {
    const response = await axiosInstance.post(
      `/forms/${applicationId}/add-tenant`,
      data
    );
    return response.data;
  }

  static async getTenantSignatures(applicationId: string, axiosInstance: AgentAxiosType = agentAxios) {
    const response = await axiosInstance.get(
      `/forms/${applicationId}/agreement/tenant-signatures/`
    );
    return response.data;
  }

  static async getTenantSignatures1(applicationId: string, axiosInstance: AgentAxiosType = agentAxios) {
    const response = await axiosInstance.get(
      `/forms/${applicationId}/agreement/tenant-signatures-1/`
    );
    return response.data;
  }

  static async markAgreementFormCompleted(applicationId: string, axiosInstance: AgentAxiosType = agentAxios) {
    const response = await axiosInstance.patch(
      `/forms/${applicationId}/agreement/completed`,
      {
        completed: true,
      }
    );
    return response.data;
  }
}