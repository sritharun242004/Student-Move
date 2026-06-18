import { Badge } from "@/components/ui/badge";
import { PriceDisplayInfo } from "@/utils/priceUtils";

interface PriceDisplayProps {
  priceInfo: PriceDisplayInfo | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
  utilityAmount?: number | null;
}

export function PriceDisplay({
  priceInfo,
  className = "",
  size = "md",
  utilityAmount = null,
}: PriceDisplayProps) {
  // Early return if priceInfo is invalid
  if (!priceInfo) {
    return (
      <div className={`${className}`}>
        <div
          className={`text-green-600 ${
            size === "sm"
              ? "text-lg font-semibold"
              : size === "lg"
              ? "text-2xl font-bold"
              : "text-xl font-bold"
          }`}
        >
          £0.00
        </div>
      </div>
    );
  }

  // Safe parsing with fallbacks
  const basePrice = parseFloat(priceInfo?.display_price || "0") || 0;
  const utility = parseFloat(String(utilityAmount || 0)) || 0;
  const totalPrice = basePrice + utility;

  // Ensure totalPrice is a valid number
  const safeTotalPrice = isNaN(totalPrice) ? 0 : totalPrice;

  const sizeClasses = {
    sm: "text-lg font-semibold",
    md: "text-xl font-bold",
    lg: "text-2xl font-bold",
  };

  return (
    <div className={`${className}`}>
      {/* Main price display */}
      <div className={`text-green-600 ${sizeClasses[size]}`}>
        £{safeTotalPrice.toFixed(2)}
        {utility > 0 && size !== "sm" && (
          <span className="text-sm text-gray-500 ml-1">
            (inc. £{(isNaN(utility) ? 0 : utility).toFixed(2)} utilities)
          </span>
        )}
      </div>

      {/* Commission breakdown for agents/landlords */}
      {priceInfo.showCommissionBreakdown &&
        priceInfo.basePrice &&
        priceInfo.commission && (
          <div className="mt-1 space-y-1">
            <div className="text-sm text-gray-600">
              Base: £{priceInfo.basePrice}
              {utility > 0 && (
                <span>
                  {" "}
                  + £{(isNaN(utility) ? 0 : utility).toFixed(2)} utilities
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Commission: £{priceInfo.commission} ({priceInfo.commissionRate}
                %)
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              Total for users: £
              {(
                parseFloat(priceInfo.display_price || "0") +
                utility +
                parseFloat(priceInfo.commission || "0")
              ).toFixed(2)}{" "}
              {utility > 0 && "(inc. utilities)"}
            </div>
          </div>
        )}

      {/* Utility display for small size */}
      {/* {utility > 0 && size === "sm" && (
        <div className="text-xs text-gray-500 mt-1">
          +£{(isNaN(utility) ? 0 : utility).toFixed(2)} utilities
        </div>
      )} */}
    </div>
  );
}
