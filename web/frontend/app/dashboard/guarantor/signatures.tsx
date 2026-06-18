"use client";
import React, { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "./components/input"; // Assuming this is your custom Input
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guarantorSignaturesSchema, type GuarantorSignatures } from "./schemas";
import { GuarantorService } from "./service";
// You might want a toast library for user feedback
// import { toast } from "sonner";

// --- HELPER FUNCTION ---
// Converts a base64 data URL to a File object, which is needed for FormData
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error("Invalid data URL");
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// Helper function to convert canvas to data URL using toBlob
function canvasToDataURL(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create blob from canvas"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}

interface SignaturesProps {
  handleBack: () => void;
  formId: string;
  onSave: (data: GuarantorSignatures) => void;
  initialData?: Partial<GuarantorSignatures>;
}

export default function Signatures({
  handleBack,
  formId,
  onSave, // This might be used to navigate away on completion
  initialData,
}: SignaturesProps) {
  const guarantorSignatureRef = useRef<SignatureCanvas | null>(null);
  const witnessSignatureRef = useRef<SignatureCanvas | null>(null);

  // States to manage loading for each button
  const [isSavingGuarantor, setIsSavingGuarantor] = useState(false);
  const [isSavingWitness, setIsSavingWitness] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const form = useForm<GuarantorSignatures>({
    resolver: zodResolver(guarantorSignaturesSchema),
    defaultValues: initialData || {},
  });

  const handleSaveGuarantor = async () => {

    // Check if signature pad exists

  // Relationship now optional; no need to block save on it
  const isValid = true;

    if (guarantorSignatureRef.current?.isEmpty()) {
      return form.setError("guarantor_signature", {
        type: "manual",
        message: "Guarantor signature is required",
      });
    }
    if (!isValid) {
      console.log("Error: Form validation failed");
      return;
    }

    setIsSavingGuarantor(true);
    try {
      const canvas = guarantorSignatureRef.current?.getCanvas();
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      const signatureDataURL = await canvasToDataURL(canvas);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueFilename = `guarantor_${formId}_signature_${timestamp}.png`;
      const signatureFile = dataURLtoFile(signatureDataURL, uniqueFilename);

      const formData = new FormData();
      formData.append("guarantor_signature", signatureFile);
      const gRel = form.getValues("g_relationship");
      if (gRel) {
        formData.append("g_relationship", gRel);
      }
      formData.append("gs_date", new Date().toISOString().split("T")[0]); // YYYY-MM-DD format

      await GuarantorService.saveGuarantorSignature(formId, formData);
      // toast.success("Guarantor signature saved!");
    } catch (error) {
      console.error("Error saving guarantor signature:", error);
      // toast.error("Failed to save. Please try again.");
      form.setError("guarantor_signature", {
        type: "manual",
        message: "Failed to save signature. Please try again.",
      });
    } finally {
      setIsSavingGuarantor(false);
    }
  };

  const handleSaveWitness = async () => {
  // Relationship now optional; no need to block save on it
  const isValid = true;
    if (witnessSignatureRef.current?.isEmpty()) {
      return form.setError("witness_signature", {
        type: "manual",
        message: "Witness signature is required",
      });
    }
    if (!isValid) return;

    setIsSavingWitness(true);
    try {
      const canvas = witnessSignatureRef.current?.getCanvas();
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      const signatureDataURL = await canvasToDataURL(canvas);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueFilename = `witness_${formId}_signature_${timestamp}.png`;
      const signatureFile = dataURLtoFile(signatureDataURL, uniqueFilename);

      const formData = new FormData();
      formData.append("witness_signature", signatureFile);
      const wsRel = form.getValues("ws_relationship");
      if (wsRel) {
        formData.append("ws_relationship", wsRel);
      }
      formData.append("ws_date", new Date().toISOString().split("T")[0]);

      await GuarantorService.saveWitnessSignature(formId, formData);
      // toast.success("Witness signature saved!");
    } catch (error) {
      console.error("Error saving witness signature:", error);
      // toast.error("Failed to save. Please try again.");
      form.setError("witness_signature", {
        type: "manual",
        message: "Failed to save signature. Please try again.",
      });
    } finally {
      setIsSavingWitness(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await GuarantorService.markGuarantorFormCompleted(formId); // This should be a PATCH request
      // toast.success("Application completed and submitted!");
      onSave(form.getValues()); // Notify parent component of completion
    } catch (error) {
      console.error("Error completing form:", error);
      // toast.error("Could not complete the application.");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Guarantor Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Guarantor Signature</Label>
            <div className="border border-input rounded-md p-2 h-40 bg-white">
              <SignatureCanvas
                ref={guarantorSignatureRef}
                canvasProps={{
                  className: "w-full h-32 bg-white touch-none",
                }}
              />
            </div>
            {form.formState.errors.guarantor_signature && (
              <p className="text-sm text-red-500">
                {form.formState.errors.guarantor_signature.message}
              </p>
            )}

          </div>
            <p className="text-xs text-muted-foreground">No need to fill two sections at once.</p>

          <div className="space-y-2">
            <Label htmlFor="g_relationship">Relationship to Applicant</Label>
            <Input id="g_relationship" {...form.register("g_relationship")} />
            {form.formState.errors.g_relationship && (
              <p className="text-sm text-red-500">
                {form.formState.errors.g_relationship.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => guarantorSignatureRef.current?.clear()}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              console.log("Save button clicked");
              handleSaveGuarantor();
            }}
            disabled={isSavingGuarantor}
          >
            {isSavingGuarantor ? "Saving..." : "Save Guarantor"}
          </Button>
        </div>

        {/* Witness Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Witness Signature</Label>
            <div className="border border-input rounded-md p-2 h-40 bg-white">
              <SignatureCanvas
                ref={witnessSignatureRef}
                canvasProps={{
                  className: "w-full h-32 bg-white touch-none",
                }}
              />
            </div>
            {form.formState.errors.witness_signature && (
              <p className="text-sm text-red-500">
                {form.formState.errors.witness_signature.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws_relationship">Relationship to Witness</Label>
            <Input id="ws_relationship" {...form.register("ws_relationship")} />
            {form.formState.errors.ws_relationship && (
              <p className="text-sm text-red-500">
                {form.formState.errors.ws_relationship.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => witnessSignatureRef.current?.clear()}
          >
            Clear
          </Button>
          <Button type="button" size="sm" onClick={handleSaveWitness}>
            {isSavingWitness ? "Saving..." : "Save Witness"}
          </Button>
        </div>

        {/* Final Actions */}
        <div className="flex justify-between mt-6 border-t pt-4">
          <Button type="button" onClick={handleBack} variant="outline">
            Back
          </Button>
          <Button type="button" onClick={handleComplete}>
            {isCompleting ? "Submitting..." : "Complete & Submit Application"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
