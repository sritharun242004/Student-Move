import { number } from "zod";

interface AdditionalDetails {
  parking: string;
  accessibility: string;
  pets_allowed: string;
  furnished: boolean;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  price: string;
  basePrice?: string; // Agent's original price before commission
  display_price?: string; // Final price with commission
  commissionRate?: number; // Commission rate percentage
  is_agent_property?: boolean; // Whether this property belongs to an agent-created landlord
  images: { id: number; image: string }[];
  bathrooms: number;
  billsIncluded: boolean; // Always true, read-only
  rooms: number;
  status: string;
  keyFeatures: string[];
  additionalDetails: AdditionalDetails;
  description: string;
  epcRating: string;
  zipCode: string;
  city: { id: number; name: string } | null;
  area: { id: number; name: string } | null;
  landLord: number;
  universities: { id: number; name: string }[];
  availableAfter: string | null;
  availableTo: string | null; // Property available until date
  securityDeposit: string | null;
  holdingDeposit: string | null;
  gasFromDate: string | null; // Gas safety certificate start date
  gasToDate: string | null; // Gas safety certificate end date
  electricFromDate: string | null; // Electric safety certificate start date
  electricToDate: string | null; // Electric safety certificate end date
  utilityAmount: number | null;
  createdAt: string;
  updatedAt: string;
  cityIndex?: number;
  areaIndex?: number;
  isFeatured?: boolean;
}

export type chatType = {
  sender: "tenant" | "landlord";
  message: string;
};

export type Inquiry = {
  id: number;
  subject: string;
  chat: chatType[];
  status: "under_discussion" | "resolved";
  createdAt: string;
  updatedAt: string;
  property: {
    id: number;
    name: string;
    address: string;
  };
  tenant: number;
};
