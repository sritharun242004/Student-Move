"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { Inquiry } from "@/types/propertyTypes";

interface ChangeStatusProps {
  inquiry: Inquiry;
  setInquiry: React.Dispatch<React.SetStateAction<Inquiry | null>>;
}

export default function ChangeStatus({
  inquiry,
  setInquiry,
}: ChangeStatusProps) {
  const { data: session } = useSession();
  const axios = useAgentAxios();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"under_discussion" | "resolved">(
    inquiry.status
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!status) {
      setError("Please select a status");
      return;
    }

    if (session?.role === "tenant") {
      setError("You are not authorized to change the status");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const statusData = {
        status: status,
      };

      await axios.put(`/tenants/inquiries/${inquiry.id}/`, statusData, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      setInquiry({ ...inquiry, status });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-green-700 font-medium">
          Status updated successfully!
        </p>
        <p className="text-sm text-green-600 mt-1">
          The property status has been changed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-gray-500 pb-2">
          Changing the status to "resolved" will allow the user to apply for a
          lease.
        </p>
        <Label htmlFor="status">Property Status</Label>

        <Select
          onValueChange={(value) =>
            setStatus(value as "under_discussion" | "resolved")
          }
          value={status}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under_discussion">Under Discussion</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="p-2 text-sm text-red-600 bg-red-50 rounded">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Status"}
      </Button>
    </form>
  );
}
