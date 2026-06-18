import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Landlord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profile: {
    phone: string;
    status: string;
    commissionRate?: string;
    createdByAgent?: boolean;
    companyName?: string;
    address?: string;
    bankAccountNumber?: string;
    sortCode?: string;
    preferredContactMethod?: string;
    notes?: string;
    openForAgents?: boolean;
  };
  propertiesCount: number;
}

interface LandlordContextStore {
  selectedLandlord: Landlord | null;
  setSelectedLandlord: (landlord: Landlord | null) => void;
  clearSelectedLandlord: () => void;
}

export const useLandlordContext = create<LandlordContextStore>()(
  persist(
    (set) => ({
      selectedLandlord: null,
      setSelectedLandlord: (landlord) => set({ selectedLandlord: landlord }),
      clearSelectedLandlord: () => set({ selectedLandlord: null }),
    }),
    {
      name: "landlord-context-storage",
    }
  )
);
