"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useSession } from "next-auth/react";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lock, PenSquare } from "lucide-react";

interface LeaseStep {
  title: string;
  status: "pending" | "completed" | "locked" | "inprogress";
  onClick: () => void;
}

const statusStyles = {
  completed: {
    icon: <CheckCircle className="h-7 w-7 text-green-500" />,
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    label: "Completed",
  },
  pending: {
    icon: <PenSquare className="h-7 w-7 text-primary" />,
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    label: "Ready to be filled",
  },
  locked: {
    icon: <Lock className="h-7 w-7 text-gray-400" />,
    bg: "bg-gray-100 border-gray-200",
    text: "text-gray-500",
    label: "Locked",
  },
  inprogress: {
    icon: <PenSquare className="h-7 w-7 text-yellow-500" />,
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-700",
    label: "In Progress",
  },
};

const LeaseStepCard: React.FC<LeaseStep> = ({ title, status, onClick }) => {
  const isLocked = status === "locked";
  const style = statusStyles[status];

  return (
    <Card
      className={`flex items-center gap-2 px-4 py-2 border-l-4 ${style.bg} ${
        style.text
      } transition-all duration-300 ${
        isLocked
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:shadow-md"
      }`}
      onClick={!isLocked ? onClick : undefined}
    >
      <div className="flex-shrink-0">{style.icon}</div>
      <div className="flex flex-col items-center">
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs">{style.label}</span>
      </div>
    </Card>
  );
};

interface LeaseStepsProps {
  params: {
    id: string;
  };
  inquiry: {
    id: number;
    property: {
      id: number;
      name: string;
      address: string;
    };
    tenant: number;
  };
}

export default function LeaseSteps({ params, inquiry }: LeaseStepsProps) {
  const router = useRouter();
  const agentAxios = useAgentAxios();
  const { data: session } = useSession();
  const [applications, setApplications] = useState<any[]>([]);
  const [agreementStatus, setAgreementStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await agentAxios.get(`/forms/applications/`);

        // Support both wrapped and direct array responses
        const allApps = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        // Only keep applications that belong to this inquiry
        const filtered = allApps.filter((app: any) => {
          const pid = app.property_id ?? app.propety; // propety kept for backward compat
          const iid = app.inquiry_id ?? null;
          return pid === inquiry.property.id && iid === inquiry.id;
        });

        setApplications(filtered);

        // Fetch agreement status for the first filtered application
        const application = filtered[0];
        if (application?.id) {
          try {
            const statusResponse = await agentAxios.get(`/forms/${application.id}/agreement/status`);
            setAgreementStatus(statusResponse.data.data);
          } catch (error) {
            console.error("Failed to fetch agreement status:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch applications", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [params.id]);

  const handleApplicationClick = () => {
    const application = applications.length > 0 ? applications[0] : null;
    let url = `/dashboard/application?propertyId=${inquiry.property.id}&inquiryId=${inquiry.id}`;
    if (application) {
      url += `&applicationId=${application.id}`;
    }
    router.push(url);
  };

  const application = applications.length > 0 ? applications[0] : null;

  const steps: LeaseStep[] = [
    {
      title: "Application Form",
      status: application
        ? application.is_completed
          ? "completed"
          : "inprogress"
        : "pending",
      onClick: handleApplicationClick,
    },
    {
      title: "Guarantor Form",
      status: application 
        ? application.guarantor?.completed 
          ? "completed"
          : application.guarantor
          ? "inprogress"
          : application.is_completed ? "pending" : "locked"
        : "locked",
      onClick: () => {
        if (application && application.is_completed) {
          router.push(
            `/dashboard/guarantor?propertyId=${params.id}&applicationId=${application.id}`
          );
        }
      },
    },
    {
      title: "Agreement",
      status: (() => {
        if (!application?.is_completed || !application?.guarantor?.completed) {
          return "locked";
        }
        
        // Use real-time agreement status if available
        if (agreementStatus) {
          const isTenant = session?.role === "tenant";
          const isAgentOrLandlord = session?.role === "agent" || session?.role === "landlord";
          
          // Map API status to step status
          switch (agreementStatus.status) {
            case "completed":
              return "completed";
            case "waiting_for_tenant":
              if (isTenant) {
                return "pending";
              } else {
                return "inprogress";
              }
            case "pending_landlord_signature":
              if (isAgentOrLandlord) {
                return "pending";
              } else {
                return "inprogress";
              }
            case "pending_admin_signature":
              if (session?.role === "admin") {
                return "pending";
              } else {
                return "inprogress";
              }
            case "can_edit":
            case "can_create":
              return "pending";
            case "locked":
            default:
              return "locked";
          }
        }
        
        // Fallback to old logic if status not available
        if (application?.agreement?.completed) {
          return "completed";
        }
        
        return "locked";
      })(),
      onClick: () => {
        if (!application || !application.is_completed || !application.guarantor?.completed) {
          return; // Prerequisites not met
        }
        
        // Check user role and permissions
        const isAgentOrLandlord = session?.role === "agent" || session?.role === "landlord";
        const isTenant = session?.role === "tenant";
        
        if (isAgentOrLandlord) {
          // Agents/landlords can always access to create or edit agreement
          router.push(
            `/dashboard/agreement?propertyId=${inquiry.property.id}&applicationId=${application.id}`
          );
        } else if (isTenant) {
          // Tenants can only access if agreement is waiting for tenant or pending landlord signature
          if (agreementStatus?.status === 'waiting_for_tenant' || agreementStatus?.status === 'pending_landlord_signature') {
            router.push(
              `/dashboard/agreement?propertyId=${inquiry.property.id}&applicationId=${application.id}`
            );
          }
          // If not in correct status, do nothing (button should show as pending)
        }
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 max-w-md">
        <h1 className="text-lg font-bold mb-2">Lease Application Process</h1>
        <div className="flex flex-col gap-4">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 max-w-md">
      <h1 className="text-lg font-bold mb-2">Lease Application Process</h1>
      <div className="flex flex-col gap-4">
        {steps.map((step) => (
          <LeaseStepCard key={step.title} {...step} />
        ))}
      </div>
    </div>
  );
}
