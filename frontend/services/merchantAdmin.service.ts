import axios from "axios";

const gatewayAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  timeout: 25000,
});

export interface MerchantOfferCounts {
  active: number;
  all: number;
}

export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  businessEmail: string;
  phone: string;
  address: string;
  isApproved: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  offerCounts: MerchantOfferCounts;
}

export interface MerchantOffer {
  id: string;
  title: string;
  description: string;
  discountType: string;
  usageLimit: number | null;
  perStudentLimit: number | null;
  usedCount: number;    
  isActive: boolean;
  expiryDate: string;
  createdAt: string;
}

export interface MerchantOffersResponse {
  merchant: {
    id: string;
    businessName: string;
    isApproved: boolean;
    isSuspended: boolean;
  };
  summary: {
    totalOffers: number;
    activeOffers: number;
    inactiveOffers: number;
    expiredOffers: number;
  };
  offers: MerchantOffer[];
}

export interface MerchantOverviewStats {
  totalOffers: number;
  activeOffers: number;
  inactiveOffers: number;
  expiredOffers: number;
  totalMerchants: number;
  approvedMerchants: number;
  suspendedMerchants: number;
  successfulRedeems: number;
  failedRedeems: number;
  totalVouchers: number;
  redeemedVouchers: number;
  expiredVouchers: number;
  pendingVouchers: number;
  totalStudentsWithRedeems: number;
  lastUpdatedAt: string;
}

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const MerchantAdminService = {
  async getOverviewStats(token: string) {
    const response = await gatewayAxios.get<MerchantOverviewStats>(
      "/merchants/admin/stats",
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  },

  async getAllMerchants(token: string) {
    const response = await gatewayAxios.get<Merchant[]>("/merchants/admin/all", {
      headers: authHeaders(token),
    });

    return response.data;
  },

  async getOffersByMerchantId(merchantId: string, token: string) {
    const response = await gatewayAxios.get<MerchantOffersResponse>(
      `/merchants/admin/merchant/${merchantId}/offers`,
      {
        headers: authHeaders(token),
      }
    );

    return response.data;
  },

  async updateMerchantApproval(
    merchantId: string,
    isApproved: boolean,
    token: string
  ) {
    const response = await gatewayAxios.patch(
      `/merchants/${merchantId}/approval`,
      { isApproved },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  async updateMerchantSuspension(
    merchantId: string,
    isSuspended: boolean,
    token: string
  ) {
    const response = await gatewayAxios.patch(
      `/merchants/${merchantId}/suspension`,
      { isSuspended },
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
