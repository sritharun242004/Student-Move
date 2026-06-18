// src/services/GuarantorService.ts (or wherever you have it)

import agentAxios from "@/config/axios.config";
import { GuarantorFormData, GuarantorPersonalDetails } from "./schemas";

export class GuarantorService {
  static async getGuarantorForm(formId: string) {
    const response = await agentAxios.get(`/forms/${formId}/guarantor/`);
    return response.data;
  }

  static async saveGuarantorDetails(
    applicationId: string,
    data: GuarantorPersonalDetails | Partial<GuarantorFormData>
  ) {
    const response = await agentAxios.put(
      `/forms/application/${applicationId}/guarantor/details/`,
      data
    );
    return response.data;
  }

  static async saveGuarantorSignature(applicationId: string, data: FormData) {
    const response = await agentAxios.post(
      `/forms/application/${applicationId}/guarantor/signature/`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  static async saveWitnessSignature(applicationId: string, data: FormData) {
    const response = await agentAxios.post(
      `/forms/application/${applicationId}/guarantor/witness-signature/`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  static async markGuarantorFormCompleted(applicationId: string) {
    const response = await agentAxios.patch(
      `/forms/guarantor/${applicationId}/completed/`,
      {
        status: "completed",
      }
    );
    return response.data;
  }
}
