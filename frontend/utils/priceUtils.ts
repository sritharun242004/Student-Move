import { Property } from "@/types/propertyTypes";
import { is } from "date-fns/locale";

export interface PriceDisplayInfo {
  display_price: string;
  basePrice?: string;
  commission?: string;
  commissionRate?: number;
  showCommissionBreakdown: boolean;
}

/**
 * Get price display information based on user role and property commission settings
 */
export function getPriceDisplayInfo(
  property: Property,
  userRole?: string,
  isActingAsLandlord?: boolean
): PriceDisplayInfo {
  isActingAsLandlord = property.is_agent_property || false;
  console.log("Calculating price display info for userRole:", userRole, "isActingAsLandlord:", isActingAsLandlord);
  console.log("Property details:", property);

  // Ensure property.price exists and is valid
  if (!property || !property.price) {
    return {
      display_price: "0",
      showCommissionBreakdown: false,
    };
  }

  // For agents viewing properties of landlords they created
  if (
    userRole === "agent" && 
    isActingAsLandlord && 
    property.basePrice && 
    property.commissionRate
  ) {
    const base = parseFloat(property.basePrice) || 0;
    const final = parseFloat(property.price) || 0;
    const commission = Math.max(0, final - base);
    
    return {
      display_price: property.display_price || "0", // Show final price like users see
      basePrice: property.display_price,
      commission: commission.toFixed(2),
      commissionRate: property.commissionRate,
      showCommissionBreakdown: true,
    };
  }
  
  // For landlords viewing their own agent-created properties
  if (
    userRole === "landlord" && 
    isActingAsLandlord && 
    property.basePrice && 
    property.commissionRate
  ) {
    const base = parseFloat(property.basePrice) || 0;
    const final = parseFloat(property.price) || 0;
    const commission = Math.max(0, final - base);
    
    return {
      display_price: property.price, // Final price
      basePrice: property.basePrice,
      commission: commission.toFixed(2),
      commissionRate: property.commissionRate,
      showCommissionBreakdown: true,
    };
  }
  
  // For admins viewing any property
  if (
    userRole === "admin" && 
    isActingAsLandlord && 
    property.basePrice && 
    property.commissionRate
  ) {
    const base = parseFloat(property.basePrice) || 0;
    const final = parseFloat(property.price) || 0;
    const commission = Math.max(0, final - base);
    
    return {
      display_price: property.display_price || "0", // Final price
      basePrice: property.basePrice,
      commission: commission.toFixed(2),
      commissionRate: property.commissionRate,
      showCommissionBreakdown: true,
    };
  }
  
  // For regular users and all other cases
  return {
    display_price: property.price,
    showCommissionBreakdown: false,
  };
}

/**
 * Format price with utility amount
 */
export function formatPriceWithUtility(price: string, utilityAmount?: number | null): string {
  const basePrice = parseFloat(price) || 0;
  const utility = utilityAmount || 0;
  const total = basePrice + utility;
  return total.toFixed(2);
}