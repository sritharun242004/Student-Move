"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Building, Settings } from "lucide-react";
import { useLandlordContext } from "@/app/store/useLandlordContext";
import Axios from "@/config/axios.config";
import { toast } from "sonner";

// Use the interface from the context to ensure compatibility
interface Landlord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profile: {
    phone: string;
    status: string;
  };
  propertiesCount: number;
}

export function LandlordSelector() {
  const { data: session } = useSession();
  const { selectedLandlord, setSelectedLandlord, clearSelectedLandlord } =
    useLandlordContext();
  const [activeLandlords, setActiveLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActiveLandlords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get("/users/agent/active-landlords/", {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      if (response.data.status === "success") {
        setActiveLandlords(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching active landlords:", error);
      toast.error("Failed to fetch active landlords");
    } finally {
      setLoading(false);
    }
  }, [session?.access]);

  const handleClearSelection = () => {
    clearSelectedLandlord();
    toast.info("Stopped acting as landlord");
  };

  useEffect(() => {
    if (session?.access && session?.role === "agent") {
      fetchActiveLandlords();
    }
  }, [session, fetchActiveLandlords]);

  // Only show for agents
  if (session?.role !== "agent") {
    return null;
  }

  const handleLandlordSelect = (landlordId: string) => {
    const landlord = activeLandlords.find(
      (l) => l.id.toString() === landlordId
    );
    if (landlord) {
      setSelectedLandlord(landlord);
      toast.success(`Now acting as ${landlord.firstName} ${landlord.lastName}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building className="h-4 w-4" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Current Selection or Selector */}
      {selectedLandlord ? (
        <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {selectedLandlord.firstName.charAt(0)}
              {selectedLandlord.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {selectedLandlord.firstName} {selectedLandlord.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {selectedLandlord.propertiesCount} properties
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-7 px-2 text-xs"
          >
            Switch
          </Button>
        </div>
      ) : activeLandlords.length > 0 ? (
        <Select onValueChange={handleLandlordSelect}>
          <SelectTrigger className="w-[200px] h-8">
            <SelectValue placeholder="Select landlord" />
          </SelectTrigger>
          <SelectContent>
            {activeLandlords.map((landlord) => (
              <SelectItem key={landlord.id} value={landlord.id.toString()}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {landlord.firstName.charAt(0)}
                      {landlord.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {landlord.firstName} {landlord.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {landlord.propertiesCount} properties
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="text-sm text-muted-foreground">
          No landlords connected
        </div>
      )}

      {/* Manage Landlords Button */}
      <Link href="/dashboard/agent-landlord-management">
        <Button variant="outline" size="sm" className="h-8 px-3">
          <Settings className="h-3 w-3 mr-1" />
          Manage
        </Button>
      </Link>
    </div>
  );
}
