export interface Payment {
  id: string;
  utility?: {
    id: string;
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
    amount: string;
    type: string;
    status: string;
    dueDate: string;
  };
  installement?: {
    id: string;
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
    amount: string;
    type: string;
    status: string;
    dueDate: string;
  };
  amount: string;
  status: "pending" | "success" | "failed";
  createdAt: string;
  updatedAt: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  recieptFile?: string;
  lease?: {
    id: number;
    property: {
      id: number;
      name: string;
      landlord: {
        id: number;
        name: string;
      };
    };
    tenant: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export type PaymentType = "utility" | "installment";
