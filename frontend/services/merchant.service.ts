import axios from "axios";

const merchantGatewayAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  timeout: 25000,
});

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export interface MerchantRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  description: string;
  address: string;
}

export interface MerchantStats {
  totalOffers: number;
  activeOffers: number;
  inactiveOffers: number;
  expiredOffers: number;
  successfulRedeems: number;
  failedRedeems: number;
  totalVouchers: number;
  expiredVouchers: number;
  pendingVouchers: number;
  totalStudentsWithRedeems: number;
  lastUpdatedAt: string;
}

export interface MerchantStatus {
  isApproved: boolean;
  isSuspended: boolean;
  hasSecretCode: boolean;
}

export interface MerchantOffer {
  id: string;
  title: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  usageLimit: number | null;
  imageUrl?: string | null;
  perStudentLimit: number | null;
  expiryDate: string;
  isActive: boolean;
  usedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertOfferPayload {
  title: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  usageLimit?: number;
  imageUrl?: string;
  perStudentLimit: number;
  expiryDate: string;
  isActive?: boolean;
}

export interface UploadedImageResponse {
  imageUrl: string;
  fileName: string;
}

export interface StudentMerchantOffer {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  usageLimit?: number | null;
  usedCount?: number;
  perStudentLimit?: number | null;
  expiryDate?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  merchant: {
     id: string;
      userId: string;
      businessName: string;
      description: string;
      businessEmail: string;
      phone: string;
      address: string;
      profileImageUrl: string;
  }
}

export interface CreateVoucherPayload {
  offerId: string;
}

export interface CreateVoucherResponse {
  id?: string;
  uniqueCode: string;
  offerId?: string;
  createdAt?: string;
  validUntil?: string;
}

export interface StudentRedeemedOffer {
  id?: string;
  offer: {
    discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
    title?: string;
  }
  uniqueCode?: string;
  createdAt?: string;
}

export interface ValidateRedemptionPayload {
  uniqueCode: string;
  merchantSecretCode: string;
}

export interface ValidateRedemptionResponse {
  success?: boolean;
  message?: string;
  status?: string;
  data?: unknown;
}

export interface MerchantRedemptionActivity {
  voucherId?: string;
  offerName?: string;
  redeemStatus?: string;
  voucherStatus?: string;
  scannedAt?: string;
  studentId?: string;
  reason?: string;
}

export interface MerchantProfile {
  businessName?: string;
  description?: string;
  address?: string;
  businessEmail?: string;
  phone?: string;
  profileImageUrl?: string;
  hasSecretCode?: boolean;
}

export interface UpdateMerchantProfilePayload {
  businessName?: string;
  description?: string;
  address?: string;
  businessEmail?: string;
  phone?: string;
  profileImageUrl?: string;
}

export interface UpdateMerchantSecretCodePayload {
  secretCode: string;
  previousSecretCode?: string;
}

const normalizeArrayResponse = <T>(payload: unknown, fallbackKeys: string[] = []): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    for (const key of fallbackKeys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
};

export const MerchantService = {
  async register(payload: MerchantRegisterPayload) {
    const response = await merchantGatewayAxios.post("/merchants/register", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  },

  async getMyStats(token: string) {
    const response = await merchantGatewayAxios.get<MerchantStats>(
      "/merchants/stats/me",
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  },

  async getMyStatus(token: string) {
    const response = await merchantGatewayAxios.get<MerchantStatus>(
      "/merchants/status/me",
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  },

  async getMyOffers(token: string) {
    const response = await merchantGatewayAxios.get<MerchantOffer[]>(
      "/offers/merchant/me",
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  },

  async uploadOfferImage(file: File, token: string) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await merchantGatewayAxios.post<UploadedImageResponse>(
      "/offers/upload-image",
      formData,
      {
        headers: {
          ...authHeaders(token),
        },
      }
    );

    return response.data;
  },

  async uploadProfileImage(file: File, token: string) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await merchantGatewayAxios.post<UploadedImageResponse>(
      "/merchants/upload-image",
      formData,
      {
        headers: {
          ...authHeaders(token),
        },
      }
    );

    return response.data;
  },

  async createOffer(payload: UpsertOfferPayload, token: string) {
    const response = await merchantGatewayAxios.post("/offers", payload, {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  },

  async updateOffer(offerId: string, payload: Partial<UpsertOfferPayload>, token: string) {
    const response = await merchantGatewayAxios.patch(`/offers/${offerId}`, payload, {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  },

  async toggleOfferActivation(offerId: string, isActive: boolean, token: string) {
    const response = await merchantGatewayAxios.patch(
      `/offers/${offerId}/activation`,
      { isActive },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  async deleteOffer(offerId: string, token: string) {
    const response = await merchantGatewayAxios.delete(`/offers/${offerId}`, {
      headers: authHeaders(token),
    });

    return response.data;
  },

  async getActiveOffers(token: string) {
    const response = await merchantGatewayAxios.get("/offers/active", {
      headers: authHeaders(token),
    });

    return normalizeArrayResponse<StudentMerchantOffer>(response.data, [
      "offers",
      "data",
      "results",
    ]);
  },

  async createVoucher(payload: CreateVoucherPayload, token: string) {
    const response = await merchantGatewayAxios.post<CreateVoucherResponse>(
      "/vouchers",
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  async getStudentRedeemedHistory(token: string) {
    const response = await merchantGatewayAxios.get(
      "/offers/student/redeemed/me",
      {
        headers: authHeaders(token),
      }
    );

    return normalizeArrayResponse<StudentRedeemedOffer>(response.data, [
      "offers",
      "redeemedOffers",
      "history",
      "data",
      "results",
    ]);
  },

  async validateRedemption(payload: ValidateRedemptionPayload, token: string) {
    const response = await merchantGatewayAxios.post<ValidateRedemptionResponse>(
      "/redemptions/validate",
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  async getMyRedemptionActivity(token: string) {
    const response = await merchantGatewayAxios.get(
      "/redemptions/activity/me",
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );

    return normalizeArrayResponse<MerchantRedemptionActivity>(response.data, [
      "activities",
      "redemptions",
      "history",
      "data",
      "results",
    ]);
  },

  async getMyProfile(token: string) {
    const response = await merchantGatewayAxios.get<MerchantProfile>(
      "/merchants/profile/me",
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  },

  async updateMyProfile(payload: UpdateMerchantProfilePayload, token: string) {
    const response = await merchantGatewayAxios.patch<MerchantProfile>(
      "/merchants/profile/me",
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  async updateMySecretCode(payload: UpdateMerchantSecretCodePayload, token: string) {
    const response = await merchantGatewayAxios.patch(
      "/merchants/profile/me/secret-code",
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },
};
