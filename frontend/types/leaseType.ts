export type LeaseStatus =
  | "pending"
  | "rejected"
  | "active"
  | "tenant_closed"
  | "landlord_closed"
  | "terminated"
  | "completed";

export interface Lease {
  id: number;
  installmentType: string;
  leaseMonths: number;
  startDate: string;
  status: LeaseStatus;
  createdAt: string;
  tenant: {
    id: number;
    name: string;
    email:string;
  };
  propertyObj: number;
  property: {
    id: number;
    name: string;
    address: string;
    landlord: {
      id: number;
      name: string;
      email: string;
      phone: string;
    };
    security_deposit: number;
    holding_deposit: number;
    utility_amount: number | null;
  };
  end_date: string;
  chat_thread_id: number;
  installmentAmount: number;
  admin_signed: boolean;
  sourceApplication?: {
    id: number;
  };
  monthly_rent?: number;
  holding_fee?: number;
}

export interface Maintainance {
  id: number;
  images: { id: number; image: string }[];
  status: string;
  issueTitle: string;
  location: string;

  description: string;
  priority: string;
  createdAt: string;
  lease: {
    id: number;
    tenant: {
      id: number;
      name: string;
    };
  };
  property: {
    id: number;
    name: string;
  };
}

export interface Inspection {
  createdAt: string;
  date: string;
  id: number;
  inspectionDate: string;
  lease: {
    id: number;
    tenant: {
      id: number;
      name: string;
    };
    property: {
      name: string;
    };
  };
  notes: string;
  status: string;
  time: string;
}
