"use client";

import { useFormContext } from "react-hook-form";
import { GuarantorFormData } from "../schemas";
import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GuarantorStepProps } from "../types";
import { useAgentAxios } from "@/hooks/useAgentAxios";

export default function GuarantorFinalStep({
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  onSubmit,
  isSharedAccess,
}: GuarantorStepProps) {
  const mainForm = useFormContext<GuarantorFormData>();
  const agentAxios = useAgentAxios();
  const guarantorSignatureRef = useRef<SignatureCanvas | null>(null);
  const witnessSignatureRef = useRef<SignatureCanvas | null>(null);
  const [guarantorSaved, setGuarantorSaved] = useState(false);
  const [witnessSaved, setWitnessSaved] = useState(false);
  const [signaturesLoaded, setSignaturesLoaded] = useState(false);

  // Watch for signature field changes to restore them
  const guarantorSignature = mainForm.watch('guarantor_signature');
  const witnessSignature = mainForm.watch('witness_signature');

  // Load signatures when form data becomes available
  useEffect(() => {
    const loadSignatures = async () => {
      if (!signaturesLoaded && guarantorSignatureRef.current && witnessSignatureRef.current) {
        const guarantorSig = mainForm.getValues('guarantor_signature');
        const witnessSig = mainForm.getValues('witness_signature');
        
        
        if (guarantorSig) {
          await loadSignatureToCanvas('guarantor', guarantorSig);
        }
        if (witnessSig) {
          await loadSignatureToCanvas('witness', witnessSig);
        }
        
        setSignaturesLoaded(true);
      }
    };
    
    loadSignatures();
  }, [signaturesLoaded, mainForm, guarantorSignature, witnessSignature]);

  // Watch for manual changes to witness signature specifically
  useEffect(() => {
  }, [witnessSignature]);

  const loadSignatureToCanvas = async (type: 'guarantor' | 'witness', signatureData: string) => {
    const pad = type === 'guarantor' ? guarantorSignatureRef.current : witnessSignatureRef.current;
    
    
    if (!pad || !signatureData) {
      console.log(`Cannot load ${type} signature: pad=${!!pad}, data=${!!signatureData}`);
      return;
    }
    
    try {
      if (signatureData.startsWith('data:')) {
        // It's a data URL from current session
        pad.fromDataURL(signatureData);
      } else if (signatureData.startsWith('http') || signatureData.startsWith('/')) {
        // It's a URL from backend, fetch and convert to data URL
        const response = await fetch(signatureData.startsWith('/') 
          ? `${process.env.NEXT_PUBLIC_API_URL}${signatureData}`
          : signatureData);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          pad.fromDataURL(dataUrl);
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error(`Failed to restore ${type} signature:`, error);
    }
  };

  // Remove the data fetching since we'll handle it in the parent

  const clearSignature = (type: "guarantor" | "witness") => {
    if (type === "guarantor") {
      guarantorSignatureRef.current?.clear();
      mainForm.setValue("guarantor_signature", "");
      setGuarantorSaved(false);
    } else {
      witnessSignatureRef.current?.clear();
      mainForm.setValue("witness_signature", "");
      setWitnessSaved(false);
    }
    // Reset the loaded state so signatures can be reloaded if needed
    setSignaturesLoaded(false);
  };

  const saveSignature = async (type: "guarantor" | "witness"): Promise<boolean> => {
    const pad = type === "guarantor" ? guarantorSignatureRef.current : witnessSignatureRef.current;
    
    if (pad?.isEmpty()) {
      mainForm.setError(
        type === "guarantor" ? "guarantor_signature" : "witness_signature",
        {
          type: "manual",
          message: "Please sign before proceeding",
        }
      );
      return false;
    }

    try {
      const canvas = pad?.getCanvas();
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
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

      
      if (dataUrl) {
        const fieldName = type === "guarantor" ? "guarantor_signature" : "witness_signature";
        mainForm.setValue(fieldName, dataUrl);
        
        // Verify the value was set
        const setValue = mainForm.getValues(fieldName);
        
        if (type === "guarantor") {
          setGuarantorSaved(true);
        } else {
          setWitnessSaved(true);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${type} signature:`, error);
      mainForm.setError(
        type === "guarantor" ? "guarantor_signature" : "witness_signature",
        {
          type: "manual",
          message: "Failed to save signature. Please try again.",
        }
      );
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validate relationships
    const isValid = await mainForm.trigger(["g_relationship", "ws_relationship"]);
    if (!isValid) return;

    try {
      // Get signature data and ensure it's properly formatted
      const guarantorSigValue = mainForm.getValues("guarantor_signature");
      const witnessSigValue = mainForm.getValues("witness_signature");

      const allData = mainForm.getValues();
      
      // Submit the main form data WITH signatures included
      const submitData = {
        ...allData,
        guarantor_signature: guarantorSigValue || '', // Include signatures in main payload
        witness_signature: witnessSigValue || '',
      };

      
      if (isLastStep) {
        await onSubmit(submitData);
      } else {
        // If not the last step, proceed to next
        onNext?.();
      }

    } catch (error) {
      console.error("Error in form submission:", error);
      throw error; // Re-throw to let parent handle
    }
  };

  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataURL: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const arr = dataURL.split(",");
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
        resolve(new Blob([u8arr], { type: mime }));
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
      {/* Hidden inputs for signature fields */}
      <input type="hidden" {...mainForm.register('guarantor_signature')} />
      <input type="hidden" {...mainForm.register('witness_signature')} />
      
      {/* Debug info */}
      <div className="hidden">
        <p>Debug: Guarantor signature registered: {!!mainForm.getValues('guarantor_signature')}</p>
        <p>Debug: Witness signature registered: {!!mainForm.getValues('witness_signature')}</p>
      </div>
      
      <p className="text-xs text-muted-foreground">No need to fill two sections at once.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={mainForm.control}
          name="g_relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship to Applicant</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={mainForm.control}
          name="ws_relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Witness Relationship</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormLabel>Guarantor Signature</FormLabel>
                    <div className="border rounded-md p-2 w-[300px]">
            <SignatureCanvas
              ref={guarantorSignatureRef}
              canvasProps={{
                className: "border w-full h-32 bg-white touch-none",
              }}
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => clearSignature("guarantor")}
              >
                Clear
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={async () => saveSignature("guarantor")}
                disabled={guarantorSaved}
              >
                {guarantorSaved ? "Saved" : "Save"}
              </Button>
            </div>
            {guarantorSaved && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {guarantorSignature && guarantorSignature.startsWith('http') 
                    ? 'Signature loaded from previous submission' 
                    : 'Signature saved'}
              </p>
            )}
          </div>
          {mainForm.formState.errors.guarantor_signature && (
            <p className="text-sm text-red-500 mt-1">
              {mainForm.formState.errors.guarantor_signature.message}
            </p>
          )}
        </div>

        <div>
          <FormLabel>Witness Signature</FormLabel>
          <div className="border rounded-md p-2 w-[300px]">
            <SignatureCanvas
              ref={witnessSignatureRef}
              canvasProps={{
                className: "border w-full h-32 bg-white touch-none",
              }}
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => clearSignature("witness")}
              >
                Clear
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={async () => {
                  const result = await saveSignature("witness");
                  if (result) {
                    // Double-check that the value is actually stored
                    setTimeout(() => {
                      const storedValue = mainForm.getValues('witness_signature');
                    }, 100);
                  }
                }}
                disabled={witnessSaved}
              >
                {witnessSaved ? "Saved" : "Save"}
              </Button>
            </div>
            {witnessSaved && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {witnessSignature && witnessSignature.startsWith('http') 
                    ? 'Signature loaded from previous submission' 
                    : 'Signature saved'}
              </p>
            )}
          </div>
          {mainForm.formState.errors.witness_signature && (
            <p className="text-sm text-red-500 mt-1">
              {mainForm.formState.errors.witness_signature.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Back
          </Button>
        )}
        <Button type="submit">{isLastStep ? "Submit" : "Next"}</Button>
      </div>
    </form>
  );
}
