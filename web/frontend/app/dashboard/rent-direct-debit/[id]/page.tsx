"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Axios from "@/config/axios.config";

interface DirectDebitInstallment {
  id: string;
  notes?: string;
  status?: string;
}

export default function RentDirectDebitPage() {
  const params = useParams();
  const leaseId = params.id as string;
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [directDebitData, setDirectDebitData] = useState<DirectDebitInstallment | null>(null);

  // Fetch existing direct debit installment record
  useEffect(() => {
    const fetchDirectDebitData = async () => {
      try {
        if (!session?.access || !leaseId) {
          setLoading(false);
          return;
        }

        const response = await Axios.get(
          `/tenants/direct-debit-installment/${leaseId}/`,
          {
            headers: {
              Authorization: `Bearer ${session?.access}`,
            },
          }
        );

        // Check if there are any records
        if (response.data && response.data.length > 0) {
          // Get the first (or only) record since it's a OneToOne relationship
          setDirectDebitData(response.data[0]);
        }
        setLoading(false);
      } catch (err) {
        // No existing record found, which is fine
        console.log("No existing direct debit record found");
        setLoading(false);
      }
    };

    fetchDirectDebitData();
  }, [leaseId, session?.access]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    } else {
      setProofFile(null);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proofFile && !notes) {
      toast.error("Please upload a proof file or add notes.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Submitting direct debit documents...");

    try {
      const formData = new FormData();

      // Add proof_file if present
      if (proofFile) {
        formData.append("proof_file", proofFile);
      }

      // Add notes if present
      if (notes) {
        formData.append("notes", notes);
      }

      // Add lease_id for record creation if needed
      formData.append("lease_id", leaseId || "");

      // Use PATCH to update or create (if not found)
      const response = await Axios.patch(
        `/tenants/direct-debit-installment/${leaseId}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Direct debit documents submitted successfully!");

      // Reset form
      setProofFile(null);
      setNotes("");
      setIsSubmitting(false);
    } catch (err) {
      console.error("Error submitting direct debit documents:", err);
      toast.error("Failed to submit direct debit documents. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Direct Debit Documentation</h1>

      {/* Submitted Data Display */}
      {directDebitData && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4 text-green-900">
                  ✓ Direct Debit Setup Status
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">
                    {directDebitData.status || "Pending"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Record ID</p>
                  <p className="font-medium text-xs break-all">
                    {directDebitData.id}
                  </p>
                </div>
              </div>

              {directDebitData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">
                    {directDebitData.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">
                Submit Direct Debit Documents
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide any supporting documents and notes for your
                Direct Debit setup.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proof_file">Proof Files</Label>
                  <Input
                    id="proof_file"
                    name="proof_file"
                    type="file"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    accept="image/*,.pdf"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PNG, JPG, PDF.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Add any additional information here"
                    className="h-20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || (!proofFile && !notes)}
              >
                {isSubmitting ? "Submitting..." : "Submit Documents"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
