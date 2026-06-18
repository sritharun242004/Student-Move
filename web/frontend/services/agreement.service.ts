import { useAgentAxios } from "@/hooks/useAgentAxios";

const agentAxios = useAgentAxios();

export class AgreementService {
  static async getAgreementForm(applicationId: string) {
    const response = await agentAxios.get(`/forms/${applicationId}/agreement/`);
    return response.data;
  }

  static async saveAgreementForm(applicationId: string, data: any) {
    const response = await agentAxios.post(
      `/forms/agreement/add-details`,
      { ...data, application: parseInt(applicationId) }
    );
    return response.data;
  }

  static async updateAgreementForm(applicationId: string, data: any) {
    const response = await agentAxios.put(
      `/forms/${applicationId}/agreement/add-details`,
      { ...data, application: parseInt(applicationId) }
    );
    return response.data;
  }

  static async markAgreementCompleted(applicationId: string) {
    const response = await agentAxios.patch(
      `/forms/${applicationId}/agreement/completed`
    );
    return response.data;
  }
}