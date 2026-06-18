"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ApplicationFormView from "@/components/forms/application-form-view";
import GuarantorFormView from "@/components/forms/guarantor-form-view";
import AgreementFormEdit from "@/components/forms/agreement-form-edit";

interface FormsViewProps {
  inquiry: any; // Pass the full inquiry object instead of just ID
}

export default function FormsView({ inquiry }: FormsViewProps) {
  const { data: session } = useSession();
  const axios = useAgentAxios();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // No manual lease creation; leases are created automatically by backend

  // Memoize the key inquiry data to prevent unnecessary re-renders
  const inquiryData = {
    id: inquiry?.id,
    propertyId: inquiry?.property?.id,
    tenantId: inquiry?.tenant
  };

  const fetchApplications = async () => {
    
    if (!inquiryData.propertyId || !inquiryData.tenantId) {
      console.log("Missing property or tenant ID, skipping fetch");
      setIsLoading(false);
      return;
    }    
    setIsLoading(true);
    
    try {
      
      let foundApplications: any[] = [];
      
      try {
        // Use the improved backend endpoint with tenant_id parameter
  const endpoint = `forms/apply/${inquiryData.propertyId}/?tenant_id=${inquiryData.tenantId}&inquiry_id=${inquiryData.id}`;
        
        const response = await axios.get(endpoint);
        
        if (response.data && response.data.status === 'success') {
          foundApplications = response.data.data || [];
        } else if (Array.isArray(response.data)) {
          // Fallback if response format is different
          foundApplications = response.data;
        }
        
      } catch (error: any) {
        console.log("Applications fetch failed:", error);
        console.log("Error details:", error.response?.status, error.response?.data);
        
      }
      
      setApplications(foundApplications);
    } catch (error: any) {
      console.error("Failed to fetch applications", error);
      console.error("Error details:", error.response?.status, error.response?.data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    
    if (inquiryData.propertyId && inquiryData.tenantId && session) {
      fetchApplications();
    }
  }, []);

  // Notify once when agreement is completed and lease should have been auto-created
  useEffect(() => {
    const app = applications.length > 0 ? applications[0] : null;
    if (
      app?.is_completed &&
      app?.guarantor?.completed &&
      app?.agreement?.completed
    ) {
      const key = `lease-toast-${app.id}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
        toast.success("Lease created automatically", {
          description: "Agreement fully signed. Lease has been created.",
        });
        sessionStorage.setItem(key, "1");
      }
    }
  }, [applications]);

  // Only show forms for landlords and agents
  if (session?.role !== "landlord" && session?.role !== "agent") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Application Forms</h3>
        <p>Loading application forms...</p>
        <p className="text-sm text-muted-foreground">
          Looking for applications for property #{inquiryData.propertyId} by tenant #{inquiryData.tenantId}
        </p>
      </div>
    );
  }

  const application = applications.length > 0 ? applications[0] : null;

  // Check if all forms are completed and ready for lease creation
  // Backend will auto-create the lease when agreement is fully signed; no action needed here

  if (!application) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Application Forms</h3>
        <p className="text-muted-foreground">
          No application found for this inquiry.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Application Forms</h3>
        
        {/* Informational banner when all forms are completed */}
        {application?.is_completed && application?.guarantor?.completed && application?.agreement?.completed && application?.agreement?.pending_admin_signature && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">All Forms Completed</p>
                  <p className="text-sm text-green-600">Lease is created automatically once both tenant and landlord signatures are in.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Status indicator for incomplete forms */}
        {application && !(application.is_completed && application.guarantor?.completed && application.agreement?.completed) && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Forms In Progress</p>
                  <p className="text-sm text-yellow-600">
                    {!application.is_completed && "Application form incomplete"}
                    {application.is_completed && !application.guarantor?.completed && "Guarantor form incomplete"}
                    {application.is_completed && application.guarantor?.completed && !application.agreement?.completed && "Agreement form incomplete"}
                    {application.is_completed && application.guarantor?.completed && application.agreement?.completed && !application.agreement?.agent_filled && "Agreement needs agent details"}
                    {application.is_completed && application.guarantor?.completed && application.agreement?.agent_filled && (!application.agreement?.land_lord_sign || !application.agreement?.lead_tenant_sign) && "Signatures missing"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="application" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="application" className="flex items-center gap-2">
            Application Form
            {application?.is_completed && <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="guarantor" className="flex items-center gap-2">
            Guarantor Form
            {application?.guarantor?.completed && <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="agreement" className="flex items-center gap-2">
            Agreement
            {application?.agreement?.completed && <Badge variant="secondary" className="bg-green-100 text-green-800">✓</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="application" className="mt-4">
          <ApplicationFormView applicationId={application.id.toString()} />
        </TabsContent>
        
        <TabsContent value="guarantor" className="mt-4">
          <GuarantorFormView applicationId={application.id.toString()} />
        </TabsContent>
        
        <TabsContent value="agreement" className="mt-4">
          <AgreementFormEdit applicationId={application.id.toString()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}