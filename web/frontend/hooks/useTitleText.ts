export const useTitleText = (role?: string) => {
  switch (role?.toLowerCase()) {
    case "merchant":
      return "Merchant Dashboard";
    case "admin":
      return "Admin Dashboard";
    case "landlord":
      return "Landlord Dashboard";
    case "agent":
      return "Agent Dashboard";
    case "tenant":
      return "Tenant Dashboard";
    default:
      return "Dashboard";
  }
};
