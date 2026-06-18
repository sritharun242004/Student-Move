"use client";
import { Controller, type Control } from "react-hook-form";
import { HomeIcon, UserIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
  control: Control<any>;
  error?: string;
}

export function RoleSelector({ control, error }: RoleSelectorProps) {
  return (
    <div className="space-y-1">
      <div className="space-y-2">
        <h3 className="font-medium">I am a:</h3>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* Tenant Option */}
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 text-center transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
                  field.value === "tenant"
                    ? "border-primary bg-primary/30"
                    : "border-muted bg-transparent"
                )}
              >
                <input
                  type="radio"
                  value="tenant"
                  checked={field.value === "tenant"}
                  onChange={() => field.onChange("tenant")}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "mb-2 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    field.value === "tenant"
                      ? "bg-primary text-black"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="font-medium">Tenant</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  I'm looking for accommodation
                </div>
              </label>

              {/* Landlord Option */}
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 text-center transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
                  field.value === "landlord"
                    ? "border-primary bg-primary/30"
                    : "border-muted bg-transparent"
                )}
              >
                <input
                  type="radio"
                  value="landlord"
                  checked={field.value === "landlord"}
                  onChange={() => field.onChange("landlord")}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "mb-2 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    field.value === "landlord"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <HomeIcon className="h-5 w-5" />
                </div>
                <div className="font-medium">Landlord</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  I want to list my properties
                </div>
              </label>

              {/* Agent Option */}
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 text-center transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
                  field.value === "agent"
                    ? "border-primary bg-primary/30"
                    : "border-muted bg-transparent"
                )}
              >
                <input
                  type="radio"
                  value="agent"
                  checked={field.value === "agent"}
                  onChange={() => field.onChange("agent")}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "mb-2 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    field.value === "agent"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <UsersIcon className="h-5 w-5" />
                </div>
                <div className="font-medium">Agent</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  I represent landlords
                </div>
              </label>
            </div>
          )}
        />
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
