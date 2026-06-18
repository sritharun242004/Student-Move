export const useRoleColor = (role?: string) => {
  switch (role?.toLowerCase()) {
    case "merchant":
      return "bg-card";
    case "admin":
      return "bg-[#FFC6B3]";
    case "landlord":
      return "bg-[#FFD9A6]";
    case "agent":
      return "bg-[#CCE6CC]";
    case "tenant":
      return "bg-[#FFFBF1]";
    default:
      return "bg-card";
  }
};
