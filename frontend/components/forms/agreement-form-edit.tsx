"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useAuthAxios } from "@/hooks/useAuthAxios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Lock, Clock, CheckCircle, AlertCircle } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

const agreementFormSchema = z.object({
  agent: z.string().min(1, "Agent name is required"),
  agent_address: z.string().min(1, "Agent address is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  amount: z.string().min(1, "Amount is required"),
  payment_description: z.string().optional(),
  land_lord_sign: z.string().optional(),
});

type AgreementFormData = z.infer<typeof agreementFormSchema>;

interface TenantSignature {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  sign?: string;
  date: string;
  tenant_user_id?: number;
  tenant_user_name?: string;
}

interface AgreementFormEditProps {
  applicationId: string;
}

interface AgreementStatus {
  exists: boolean;
  can_create: boolean;
  can_edit: boolean;
  status: "locked" | "pending" | "can_edit" | "can_create" | "completed" | "unauthorized" | "waiting_for_tenant" | "can_sign" | "pending_landlord_signature" | "pending_admin_signature";
  agent_filled?: boolean;
  tenant_filled?: boolean;
  completed?: boolean;
  is_agent_details_complete?: boolean;
  message?: string;
  waiting_for_tenant?: boolean;
  can_sign?: boolean;
  pending_landlord_signature?: boolean;
  pending_admin_signature?: boolean;
  draft?: boolean;
}

export default function AgreementFormEdit({ applicationId }: AgreementFormEditProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [agreementStatus, setAgreementStatus] = useState<AgreementStatus | null>(null);
  const agentAxios = useAgentAxios();
  const authAxios = useAuthAxios();
  const { data: session } = useSession();
  
  // Signature refs
  const landlordSignatureRef = useRef<SignatureCanvas | null>(null);
  
  // Signature states
  const [landlordSaved, setLandlordSaved] = useState(false);
  const [tenantSignatures, setTenantSignatures] = useState<TenantSignature[]>([]);
  
  // Warning dialog state
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [unsignedTenants, setUnsignedTenants] = useState<TenantSignature[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState<AgreementFormData | null>(null);
  
  const isAgent = session?.role === "agent" || session?.role === "landlord";
  const isTenant = session?.role === "tenant";

  // Helper to ensure media URLs point to backend host when starting with '/'
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return url as any;
    return url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL}${url}` : url;
  };

  // Use appropriate axios based on user role
  const axios = isAgent ? agentAxios : authAxios;



  const form = useForm<AgreementFormData>({
    resolver: zodResolver(agreementFormSchema),
    defaultValues: {
      agent: "",
      agent_address: "",
      start_date: "",
      end_date: "",
      amount: "",
      payment_description: "",
      land_lord_sign: "",
    },
  });

  // Watch for signature field changes to restore them
  const landlordSignature = form.watch('land_lord_sign');

  // Signature functions
  const loadSignatures = async (landlordSig?: string) => {
    if (landlordSig && landlordSignatureRef.current) {
      try {
        if (landlordSig.startsWith('http') || landlordSig.startsWith('/')) {
          // Load from URL
          const response = await fetch(landlordSig);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            landlordSignatureRef.current?.fromDataURL(dataUrl);
            setLandlordSaved(true);
          };
          reader.readAsDataURL(blob);
        } else if (landlordSig.startsWith('data:')) {
          // Load from base64
          landlordSignatureRef.current.fromDataURL(landlordSig);
          setLandlordSaved(true);
        }
      } catch (error) {
        console.error('Failed to restore landlord signature:', error);
      }
    } else if (landlordSig) {
      // Signature exists but canvas not ready yet, just mark as saved
      setLandlordSaved(true);
    }
  };

  useEffect(() => {
    const fetchAgreementData = async () => {
      try {
        setLoading(true);
        
        // Fetch application data to get property details and lease period
        const appResponse = await axios.get(`/forms/application/${applicationId}/`);
        // Handle both wrapped and unwrapped response structures
        let appData = appResponse.data.data || appResponse.data;        
        let propData: any = null;
        // Fetch property data
        if (appData.property) {
          try {
            const propResponse = await axios.get(`/properties/${appData.property}/`);
            propData = propResponse.data.data || propResponse.data;
          } catch (propError) {
            console.error("Error fetching property data:", propError);
          }
        }
        
        // First check status
        const statusResponse = await axios.get(`/forms/${applicationId}/agreement/status`);
        const status = statusResponse.data.data;
        
        setAgreementStatus(status);
        
        if (status.exists) {
          // Fetch agreement data if it exists
          const response = await axios.get(`/forms/${applicationId}/agreement/`);
          if (response.data) {
            const data = response.data;
            setAgreementId(data.id);
            
            form.reset({
              agent: data.agent || "",
              agent_address: data.agent_address || "",
              start_date: data.start_date || "",
              end_date: data.end_date || "",
              amount: data.amount || "",
              payment_description: data.payment_description || "",
              land_lord_sign: data.land_lord_sign || "",
            });
            
            // Fetch tenant signatures from the new endpoint
            try {
              const tensigResponse = await axios.get(`/forms/${applicationId}/agreement/tenant-signatures/`);
              if (tensigResponse.data && tensigResponse.data.data && tensigResponse.data.data.tenant_signatures) {
                const tenantSigs = tensigResponse.data.data.tenant_signatures;
                setTenantSignatures(tenantSigs);
              }
            } catch (sigError) {
              console.error("Error fetching tenant signatures:", sigError);
            }
            
            // Load landlord signature if present
            setTimeout(() => {
              loadSignatures(data.land_lord_sign);
            }, 100);
          }
        } else if (isAgent && status.can_create) {
          
          const autoFilledData: any = {
            agent: "",
            agent_address: propData?.address + ", " + propData.town + ", " + propData.city  || "",
            start_date: appData?.start_date || "",
            end_date: appData?.end_date || "",
            amount: "",
            payment_description: "",
            land_lord_sign: "",
          };
          
          if (propData?.price) {
            const monthlyRent = parseFloat(propData.price) * 4;
            autoFilledData.amount = monthlyRent.toFixed(2);
          }          
          form.reset(autoFilledData);
        }
      } catch (error) {
        console.error("Error fetching agreement data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchAgreementData();
    }
  }, [applicationId, form, isAgent]);

  const onSubmit = async (data: AgreementFormData) => {
    // If this is the "Submit Final Agreement" action, show warning dialog
    if (isAgent && agreementStatus?.status === "pending_landlord_signature") {
      // Always show warning dialog - show all tenant signatures
      setUnsignedTenants(tenantSignatures);
      setPendingSubmit(data);
      setShowWarningDialog(true);
      return;
    }

    // Execute the actual submission
    await executeSubmit(data);
  };

  const executeSubmit = async (data: AgreementFormData) => {
    if (!agreementStatus?.can_edit && !agreementStatus?.can_create) {
      toast.error("You don't have permission to edit this form");
      return;
    }

    // Check if session is loaded
    if (!session) {
      toast.error("Session not loaded, please wait and try again");
      return;
    }

    // Check if access token exists
    if (!session.access) {
      toast.error("Authentication token missing, please refresh the page");
      return;
    }

    try {
      setSaving(true);
      
      const payload: any = {
        application: parseInt(applicationId),
      };

      // For agents, include all form data
      Object.assign(payload, {
        agent: data.agent,
        agent_address: data.agent_address,
        start_date: data.start_date,
        end_date: data.end_date,
        amount: data.amount,
        payment_description: data.payment_description,
      });

      // Handle base64 signatures for agents
      if (data.land_lord_sign && data.land_lord_sign.startsWith('data:')) {
        payload.land_lord_sign = data.land_lord_sign;
      }

      let response;
      
      // Decide method: always update (PUT) if record exists or use POST for creation
      const shouldUsePut = Boolean(agreementId) || Boolean(agreementStatus?.exists);

      if (shouldUsePut) {
        response = await axios.put(`/forms/${applicationId}/agreement/add-details`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        response = await axios.post(`/forms/${applicationId}/agreement/add-details`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        // If backend wraps response with data object, capture id
        const newId = response.data?.data?.id ?? response.data?.id;
        if (newId) setAgreementId(newId);
      }

      toast.success("Agreement form saved successfully");
      
      // After landlord signs, show message that it's pending admin signature
      if (isAgent && agreementStatus.status === "pending_landlord_signature" && data.land_lord_sign) {
        toast.info("Agreement is now pending admin signature");
      }
      
      // Refresh status
      const statusResponse = await axios.get(`/forms/${applicationId}/agreement/status`);
      setAgreementStatus(statusResponse.data.data);
      
      // Refresh agreement details
      try {
        const agreementResponse = await axios.get(`/forms/${applicationId}/agreement/`);
        const data = agreementResponse.data;
        form.reset({
          agent: data.agent || "",
          agent_address: data.agent_address || "",
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          amount: data.amount || "",
          payment_description: data.payment_description || "",
          land_lord_sign: data.land_lord_sign || "",
        });
      } catch {}
      
    } catch (error: any) {
      console.error("Error saving agreement:", error);
      const errorMessage = error.response?.data?.message || "Failed to save agreement form";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      setShowWarningDialog(false);
      setPendingSubmit(null);
    }
  };

  const markAsCompleted = async () => {
    if (!agreementId) {
      toast.error("Please save the agreement first");
      return;
    }

    try {
      setSaving(true);
      await axios.patch(`/forms/${applicationId}/agreement/completed`);
      
      // Refresh status
      const statusResponse = await axios.get(`/forms/${applicationId}/agreement/status`);
      setAgreementStatus(statusResponse.data.data);
      
      toast.success("Agreement marked as completed");
    } catch (error) {
      console.error("Error marking agreement as completed:", error);
      toast.error("Failed to mark agreement as completed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agreement Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading agreement details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!agreementStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agreement Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to load agreement status</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusDisplay = () => {
    switch (agreementStatus.status) {
      case "locked":
        return {
          icon: <Lock className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Locked",
          color: "text-gray-500"
        };
      case "pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Pending",
          color: "text-yellow-500"
        };
      case "waiting_for_tenant":
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Waiting for Tenant",
          color: "text-yellow-500"
        };
      case "can_sign":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "default" as const,
          text: "Ready to Sign",
          color: "text-blue-500"
        };
      case "pending_landlord_signature":
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Awaiting Other Tenant Signatures(If not - Awaiting Landlord Signature)",
          color: "text-yellow-500"
        };
      case "pending_admin_signature":
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Awaiting Admin Signature",
          color: "text-yellow-500"
        };
      case "can_edit":
      case "can_create":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "default" as const,
          text: "Ready to Edit",
          color: "text-blue-500"
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          variant: "default" as const,
          text: "Completed",
          color: "text-green-500"
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Waiting for Admin Sign",
          color: "text-gray-500"
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const canEdit = agreementStatus.can_edit || agreementStatus.can_create;
  const isReadOnly = !canEdit || agreementStatus.status === "completed";
  
  // For tenants, make agreement data view-only in first step (waiting_for_tenant)
  const isTenantViewOnly = isTenant && agreementStatus.status === "waiting_for_tenant";
  const isFieldReadOnly = (fieldName?: string) => {
    // Always disable if completed
    if (agreementStatus.status === "completed") return true;
    
    // For tenants in waiting_for_tenant status, disable all non-signature fields
    if (isTenantViewOnly) {
      return fieldName !== 'land_lord_sign' && fieldName !== 'lead_tenant_sign';
    }
    
    // For agents/landlords, follow normal can_edit logic
    if (isAgent) {
      return !canEdit;
    }
    
    // Default fallback
    return !canEdit;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Agreement Form
          <Badge variant={statusDisplay.variant} className="flex items-center gap-1">
            {statusDisplay.icon}
            {statusDisplay.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status Information */}
        {agreementStatus.message && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{agreementStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Workflow Status Messages */}
        
        {/* For Agents/Landlords */}
        {isAgent && agreementStatus.status === "can_edit" && !agreementStatus.agent_filled && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Step 1:</strong> Fill in the agreement details below and submit. The tenant will then be able to review and sign the agreement.
            </AlertDescription>
          </Alert>
        )}

        {isAgent && agreementStatus.status === "waiting_for_tenant" && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Step 2:</strong> Agreement details submitted successfully! The tenant can now review and sign the agreement. You'll be notified when they complete their signature.
            </AlertDescription>
          </Alert>
        )}

        {isAgent && agreementStatus.status === "pending_landlord_signature" && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Step 3:</strong> The tenant has signed the agreement! Please review the final agreement and add your signature to complete the process.
            </AlertDescription>
          </Alert>
        )}

        {isAgent && agreementStatus.status === "pending_admin_signature" && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Step 4:</strong> Agreement signed successfully! The agreement is now waiting for admin approval to be finalized.
            </AlertDescription>
          </Alert>
        )}

        {/* For Tenants */}
        {isTenant && agreementStatus.status === "locked" && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Waiting for Agent/Landlord:</strong> The agent or landlord needs to create and fill in the agreement details first. You'll be able to review and sign once they complete their part.
            </AlertDescription>
          </Alert>
        )}

        {isTenant && agreementStatus.status === "waiting_for_tenant" && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Ready for Your Signature:</strong> The agreement details have been prepared by the agent/landlord. Please review the terms below and add your signature to proceed.
            </AlertDescription>
          </Alert>
        )}

        {isTenant && agreementStatus.status === "pending_landlord_signature" && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Signature Submitted:</strong> Thank you for signing! The agreement is now waiting for the agent/landlord's final signature to complete the process.
            </AlertDescription>
          </Alert>
        )}

        {/* Completed state for both */}
        {agreementStatus.status === "completed" && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Agreement Completed:</strong> All parties have signed the agreement. The lease process can now proceed to the next step.
            </AlertDescription>
          </Alert>
        )}

        {/* Legacy Flow Information - Remove these old messages */}
        {isTenant && agreementStatus.status === "pending" && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Waiting for agent/landlord to fill in the initial agreement details. 
              You'll be able to review and sign once they complete their part.
            </AlertDescription>
          </Alert>
        )}

        {/* Flow Information for Agent */}
        {isAgent && !agreementStatus.agent_filled && agreementStatus.can_create && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As an agent/landlord, you need to fill in the agreement details first. 
              The tenant/tenants will be able to review and sign after you complete this step.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Agent Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Agent Details</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="agent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent/Landlord Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter agent name" 
                          required
                          {...field} 
                          disabled={isFieldReadOnly('agent')}
                          className={isFieldReadOnly('agent') ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agent_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter agent address" 
                          {...field}
                          disabled={isFieldReadOnly('agent_address')}
                          className={isFieldReadOnly('agent_address') ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Lease Period */}
            <div>
              <h3 className="text-lg font-semibold mb-1">Lease Period</h3>
              <p className="text-sm text-gray-600 mb-4">
                These dates are derived from the tenant's application. You can modify them if necessary.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          disabled={isFieldReadOnly('start_date')}
                          className={isFieldReadOnly('start_date') ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          disabled={isFieldReadOnly('end_date')}
                          className={isFieldReadOnly('end_date') ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent Amount</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter rent amount" 
                          {...field}
                          disabled={isFieldReadOnly('amount')}
                          className={isFieldReadOnly('amount') ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter payment description" 
                          {...field}
                          disabled={isFieldReadOnly('payment_description')}
                          className={isFieldReadOnly('payment_description') ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Signatures */}
            {(agreementStatus?.agent_filled || 
              agreementStatus?.waiting_for_tenant || 
              agreementStatus?.can_sign || 
              agreementStatus?.pending_landlord_signature ||
              (isAgent && agreementStatus?.can_edit)) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Signatures</h3>
                <div className="space-y-6">
                  
                  {/* Hidden input for landlord signature field */}
                  <input type="hidden" {...form.register('land_lord_sign')} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Landlord/Agent Signature - Only show in these specific statuses */}
                    {isAgent && (agreementStatus?.pending_landlord_signature || 
                      (agreementStatus?.status === "can_edit" && !agreementStatus?.agent_filled)) && (
                      <div>
                        {(landlordSaved || landlordSignature) ? (
                          // Show signature preview after saved
                          <div>
                            <Label>Your Signature</Label>
                            <div className="border rounded-md p-2 w-full bg-gray-50">
                              <div className="h-32 flex items-center justify-center text-gray-500">
                                {landlordSignature && (landlordSignature.startsWith('http') || landlordSignature.startsWith('/')) ? (
                                  <img src={toAbsoluteUrl(landlordSignature)} alt="Your Signature" className="max-h-full" />
                                ) : landlordSignature && landlordSignature.startsWith('data:') ? (
                                  <img src={landlordSignature} alt="Your Signature" className="max-h-full" />
                                ) : (
                                  "Signature"
                                )}
                              </div>
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Signature saved
                              </p>
                            </div>
                          </div>
                        ) : (
                          // Show signature input
                          <div>
                            <Label>Landlord/Agent Signature</Label>
                            <div className="border rounded-md p-2 w-full">
                              <SignatureCanvas
                                ref={landlordSignatureRef}
                                canvasProps={{
                                  className: "border w-full h-32 bg-white touch-none",
                                }}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => landlordSignatureRef.current?.clear()}
                                >
                                  Clear
                                </Button>
                                <Button
                                  size="sm"
                                  type="button"
                                  onClick={() => {
                                    const canvas = landlordSignatureRef.current;
                                    if (!canvas || canvas.isEmpty()) {
                                      toast.error("Please provide a signature first");
                                      return;
                                    }
                                    const signatureData = canvas.toDataURL();
                                    form.setValue('land_lord_sign', signatureData);
                                    setLandlordSaved(true);
                                    toast.success("Landlord signature saved");
                                  }}
                                >
                                  Save Signature
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}



                    {/* Display tenant signatures */}
                    {tenantSignatures.length > 0 && (
                      <div>
                        <Label>Tenant Signature{tenantSignatures.length > 1 ? 's' : ''}</Label>
                        <div className="space-y-2">
                          {tenantSignatures.map((sig) => (
                            <div key={sig.id} className="border rounded-md p-2 bg-gray-50">
                              <div className="h-32 flex items-center justify-center text-gray-500">
                                {sig.sign ? (
                                  <img src={sig.sign.startsWith('http') ? sig.sign : toAbsoluteUrl(sig.sign)} alt={`${sig.full_name}'s Signature`} className="max-h-full" />
                                ) : (
                                  <span className="text-sm">Signature pending</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {sig.full_name} - Signed {new Date(sig.date).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Read-only preview for landlord's own signature after submission */}
                    {isAgent && landlordSignature && !(agreementStatus?.pending_landlord_signature || 
                      agreementStatus?.can_edit) && (
                      <div>
                        <Label>Your Signature</Label>
                        <div className="border rounded-md p-2 w-full bg-gray-50">
                          <div className="h-32 flex items-center justify-center text-gray-500">
                            {landlordSignature.startsWith('http') || landlordSignature.startsWith('/') ? (
                              <img src={toAbsoluteUrl(landlordSignature)} alt="Your Signature" className="max-h-full" />
                            ) : landlordSignature.startsWith('data:') ? (
                              <img src={landlordSignature} alt="Your Signature" className="max-h-full" />
                            ) : (
                              "Signature pending"
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            {canEdit && agreementStatus.status !== "completed" && (
              <div className="flex gap-2 justify-between items-center">
                <div className="text-red-500 text-sm">
                  Make sure to wait until all tenants have signed before submitting the final agreement.
                </div>
                {/* Show different buttons based on workflow step */}
                {isAgent && agreementStatus.status === "can_edit" && !agreementStatus.agent_filled && (
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Submit for Tenant Review"}
                  </Button>
                )}
                
                {isAgent && agreementStatus.status === "pending_landlord_signature" && (
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Submit Final Agreement"}
                  </Button>
                )}
                
                {isTenant && agreementStatus.status === "waiting_for_tenant" && (
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Submit Signature"}
                  </Button>
                )}
                
                {/* Standard save button for other cases */}
                {!((isAgent && agreementStatus.status === "can_edit" && !agreementStatus.agent_filled) ||
                    (isAgent && agreementStatus.status === "pending_landlord_signature") ||
                    (isTenant && agreementStatus.status === "waiting_for_tenant") ||
                    (isAgent && landlordSignature)) && (
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Agreement"}
                  </Button>
                )}


              </div>
            )}
          </form>
        </Form>

        {/* Warning Dialog for Unsigned Tenants */}
        <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Confirm Final Agreement Submission</AlertDialogTitle>
              <AlertDialogDescription>
                Please review all tenant signatures before submitting the final agreement:
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <ul className="space-y-2">
                {unsignedTenants.map((tenant) => (
                  <li key={tenant.id} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <div>
                      <p className="font-medium">{tenant.full_name}</p>
                      {tenant.email && <p className="text-xs text-gray-600">{tenant.email}</p>}
                      <p className="text-xs text-gray-600 mt-1">
                        {tenant.sign ? "✓ Signed" : "⏳ Pending signature"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Once you submit the final agreement, no new tenants can be added to the agreement. Make sure all tenants have signed before proceeding.
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (pendingSubmit) {
                    // Proceed with submission
                    setShowWarningDialog(false);
                    // Call executeSubmit directly
                    executeSubmit(pendingSubmit).then(() => {
                      setPendingSubmit(null);
                    });
                  }
                }}
                className="bg-red-500 hover:bg-red-700"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}