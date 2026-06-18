"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useLandlordContext } from "@/app/store/useLandlordContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertCircle, UserX } from "lucide-react";

interface LandlordGuardProps {
  children: React.ReactNode;
  requireLandlord?: boolean;
}

export function LandlordGuard({
  children,
  requireLandlord = true,
}: LandlordGuardProps) {
  const { data: session } = useSession();
  const { selectedLandlord } = useLandlordContext();

  // Check if user is active
  const isUserActive = session?.profile?.status === 'active';

  // If not an agent, render children normally
  if (!(session?.role === "agent" || session?.role === "landlord")) {
    return <>{children}</>;
  }

    // If user is not active, show inactive message
  if (!isUserActive) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Account Inactive
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your account is currently inactive. You cannot add or manage properties at this time.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact support to reactivate your account or check your account status.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session?.role === "landlord") {
    return <>{children}</>;
  }

  // If requireLandlord is false, render children normally
  if (!requireLandlord) {
    return <>{children}</>;
  }

  // If agent but no landlord selected, show selection prompt
  if (!selectedLandlord) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Select a Landlord First
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              As an agent, you need to connect to landlords to manage their
              properties and view their data. Use the landlord selector
              in the header to connect to available landlords and switch between them.
            </p>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">How to get started:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 text-left">
                <li>1. Use the "Manage" button in the landlord selector to connect to available landlords</li>
                <li>2. Once connected, use the landlord selector to switch between landlords</li>
                <li>3. Start managing properties and tenants on their behalf</li>
                <li>4. Landlords can manage agent access through their settings page</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if selected landlord is active
  const isLandlordActive = selectedLandlord?.profile?.status === 'active';

  // If landlord is not active, show inactive message
  if (!isLandlordActive) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Landlord Account Inactive
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The selected landlord's account is currently inactive. You cannot add or manage properties for this landlord at this time.
            </p>
            <p className="text-sm text-muted-foreground">
              Please select a different landlord or contact support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If landlord is selected and active, render children
  return <>{children}</>;
}
