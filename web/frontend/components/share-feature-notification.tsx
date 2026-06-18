"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Info } from "lucide-react";

export default function ShareFeatureNotification() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <div className="flex justify-between items-start">
        <AlertDescription className="text-blue-800">
          <strong>New Feature:</strong> You can now share a secure link with your guarantor! 
          They can fill out the form without creating an account. Click the "Share Guarantor Form" button above to get started.
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-auto p-1 text-blue-600 hover:text-blue-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}