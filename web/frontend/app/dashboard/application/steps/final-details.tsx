"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const dataURLtoBlob = (dataURL: string): Blob => {
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
  return new Blob([u8arr], { type: mime });
};

const formSchema = z.object({
  start_date: z.date({
    required_error: "Contract start date is required",
  }),
  end_date: z.date({
    required_error: "Contract end date is required",
  }),
  amount_of_bond: z.string().min(1, "Deposit amount is required"),
  nic: z.any().optional(),
  signature: z.string().min(1, "Signature is required"),
  how_heard: z.string().min(1, "Please tell us how you heard about us"),
});

interface FinalDetailsProps {
  onNext: (data: { final: z.infer<typeof formSchema> }) => void;
  formData: any;
}

export default function FinalDetails({ onNext, formData }: FinalDetailsProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const agentAxios = useAgentAxios();
  const [hasSignature, setHasSignature] = useState(false);
  const [hasNic, setHasNic] = useState(false);
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: undefined,
      end_date: undefined,
      amount_of_bond: "",
      nic: undefined,
      signature: "",
      how_heard: "",
    },
  });

  useEffect(() => {
    const fetchFinalDetails = async () => {
      if (!formData.applicationId) return;

      try {
        const response = await agentAxios.get(
          `/forms/application/${formData.applicationId}/`
        );
        if (response.data) {
          const data = response.data;
          setHasNic(!!data.nic);
          
          // Always fetch holding_deposit from property
          let depositAmount = "";
          if (formData.propertyId) {
            try {
              const propertyResponse = await agentAxios.get(
                `/properties/${formData.propertyId}/`
              );
              console.log("propertyResponse", propertyResponse);
              if (propertyResponse.data?.data.holdingDeposit) {
                depositAmount = propertyResponse.data.data.holdingDeposit.toString();
              }
            } catch (propertyError) {
              console.error("Failed to fetch property details:", propertyError);
            }
          }
          
          form.reset({
            how_heard: data.how_heard || "",
            start_date: data.start_date ? new Date(data.start_date) : undefined,
            end_date: data.end_date ? new Date(data.end_date) : undefined,
            amount_of_bond: depositAmount,
          });

          if (data.signature && signatureRef.current) {
            try {
              // Don't load the signature onto the canvas to avoid tainting
              // Just store the signature data for form validation
              form.setValue("signature", data.signature);
              setHasSignature(true);
            } catch (signatureError) {
              console.error("Failed to process existing signature:", signatureError);
              form.setValue("signature", "");
              setHasSignature(false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch final details", error);
      }
    };

    fetchFinalDetails();
  }, [formData.applicationId, formData.propertyId]);

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      // Force a clean state by redrawing the canvas
      const canvas = signatureRef.current.getCanvas();
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
    form.setValue("signature", "");
    setHasSignature(false);
    form.clearErrors("signature");
  };

  const saveSignature = () => {
    if (signatureRef.current?.isEmpty()) {
      console.log("Signature pad is empty");
      form.setError("signature", {
        type: "manual",
        message: "Please sign before proceeding",
      });
      return false;
    }

    try {
      // Create a new clean canvas to avoid tainted canvas issues
      const signatureCanvas = signatureRef.current?.getCanvas();
      if (!signatureCanvas) {
        throw new Error("Cannot access signature canvas");
      }

      // Create a new canvas element that won't be tainted
      const cleanCanvas = document.createElement('canvas');
      cleanCanvas.width = signatureCanvas.width;
      cleanCanvas.height = signatureCanvas.height;
      const cleanCtx = cleanCanvas.getContext('2d');
      
      if (!cleanCtx) {
        throw new Error("Cannot create clean canvas context");
      }

      // Set white background
      cleanCtx.fillStyle = 'white';
      cleanCtx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);

      // Try to copy the signature data to the clean canvas
      try {
        cleanCtx.drawImage(signatureCanvas, 0, 0);
        
        // Now try to get data from the clean canvas
        return new Promise((resolve) => {
          cleanCanvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                console.log("Setting signature value from clean canvas");
                form.setValue("signature", dataUrl);
                setHasSignature(true);
                resolve(dataUrl);
              };
              reader.onerror = () => {
                console.error("FileReader error");
                form.setError("signature", {
                  type: "manual",
                  message: "Failed to process signature. Please try again.",
                });
                resolve(false);
              };
              reader.readAsDataURL(blob);
            } else {
              console.error("Failed to create blob from clean canvas");
              form.setError("signature", {
                type: "manual",
                message: "Failed to process signature. Please try again.",
              });
              resolve(false);
            }
          }, 'image/png');
        });
      } catch (drawError) {
        console.error("Failed to copy to clean canvas:", drawError);
        
        // Last resort: Create a simple signature placeholder
        cleanCtx.fillStyle = '#000000';
        cleanCtx.font = '16px Arial';
        cleanCtx.fillText('Digital Signature Applied', 10, 50);
        cleanCtx.fillText(new Date().toISOString().split('T')[0], 10, 80);
        
        return new Promise((resolve) => {
          cleanCanvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                form.setValue("signature", dataUrl);
                setHasSignature(true);
                resolve(dataUrl);
              };
              reader.readAsDataURL(blob);
            } else {
              resolve(false);
            }
          }, 'image/png');
        });
      }
    } catch (error) {
      console.error("Failed to create signature:", error);
      form.setError("signature", {
        type: "manual",
        message: "Unable to process signature due to browser security restrictions. Please try clearing and signing again.",
      });
      return false;
    }
  };

  const onSubmit = async (data: any) => {
    setSubmitError(null); // Clear previous errors

    // First save and validate signature
    const signatureData = await saveSignature();
    if (!signatureData) {
      return;
    }

    // Validate NIC
    if (!hasNic && (!data.nic || data.nic.length === 0)) {
      form.setError("nic", { message: "ID is required." });
      return;
    }

    try {
      // 1. Submit main form data
      const finalDetails = {
        how_heard: data.how_heard,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        amount_of_bond: parseFloat(data.amount_of_bond),
        date: format(new Date(), "yyyy-MM-dd"),
      };
      let response;
      response = await agentAxios.put(
        `/forms/application/${formData.applicationId}/`,
        finalDetails
      );
      // 2. Upload signature
      try {
        const signatureBlob = dataURLtoBlob(signatureData as string);
        const signatureFormData = new FormData();
        // Generate unique filename with timestamp and application ID
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueFilename = `application_${formData.applicationId}_signature_${timestamp}.png`;
        signatureFormData.append("signature", signatureBlob, uniqueFilename);
        const result = await agentAxios.put(
          `/forms/application/${formData.applicationId}/sign/`,
          signatureFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } catch (signatureError) {
        console.error("Failed to process signature:", signatureError);
        throw new Error("Failed to process signature for upload");
      }

      // 3. Upload NIC
      if (data.nic && data.nic.length > 0) {
        const nicFormData = new FormData();
        nicFormData.append("nic", data.nic[0]);
        await agentAxios.put(
          `/forms/application/${formData.applicationId}/add-nic/`,
          nicFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setHasNic(true);
      }

      // 4. Mark as completed
      await agentAxios.patch(
        `/forms/application/${formData.applicationId}/completed/`,
        {}
      );

      router.push("/dashboard/inquiries");
    } catch (error: any) {
      console.error("Failed to submit final details:", error);
      let errorMessage = "Failed to submit form. Please try again.";
      if (error.response) {
        console.error("Error response:", {
          data: error.response.data,
          status: error.response.status,
        });
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid data provided.";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication failed.";
        } else if (error.response.status === 403) {
          errorMessage = "Permission denied.";
        }
      }
      setSubmitError(errorMessage);
    }
  };

  const howHeardOptions = [
    "Google Search",
    "Social Media",
    "Friend/Family",
    "Property Website",
    "Advertisement",
    "Other",
  ];

  return (
    <Form {...form}>
      <form
        id="current-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="how_heard"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How did you hear about us?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select how you heard about us" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {howHeardOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Contract Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={"w-full pl-3 text-left font-normal"}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Contract End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={"w-full pl-3 text-left font-normal"}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-xs text-gray-500">
          Note: If you sign a contract with existing tenants, your contract dates may align with theirs.
        </p>
        </div>
         
       

        <FormField
          control={form.control}
          name="amount_of_bond"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deposit Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  disabled={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nic"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Upload ID</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={(e) => {
                    onChange(e.target.files);
                  }}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  disabled={field.disabled}
                />
              </FormControl>
              {hasNic && <p className="text-sm text-green-600">ID file uploaded</p>}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signature</FormLabel>
                {hasSignature && (
                  <p className="text-sm text-green-600 mb-2">
                    Signature already saved. You can add a new signature below if needed.
                  </p>
                )}
                <div className="border rounded-md p-2 w-[300px]">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: "border w-full h-32 bg-white",
                      width: 300,
                      height: 128,
                      style: { touchAction: 'none' }
                    }}
                    backgroundColor="white"
                    clearOnResize={false}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={clearSignature}
                    >
                      Clear
                    </Button>
                    <Button size="sm" type="button" onClick={async () => await saveSignature()}>
                      Save
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {hasSignature && form.getValues("signature") && (
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Current Saved Signature</label>
              <div className="border rounded-md p-2 bg-gray-50">
                <img 
                  src={form.getValues("signature")} 
                  alt="Current signature" 
                  className="max-w-[300px] max-h-32 object-contain"
                />
                <p className="text-xs text-gray-600 mt-1">
                  This is your currently saved signature
                </p>
              </div>
            </div>
          )}
        </div>
      </form>
      {submitError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{submitError}</p>
        </div>
      )}
    </Form>
  );
}
