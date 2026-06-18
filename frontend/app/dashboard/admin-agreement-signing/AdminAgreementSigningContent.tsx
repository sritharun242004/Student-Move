"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, FileText, Users } from "lucide-react";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useSession } from "next-auth/react";

interface Agreement {
  id: string;
  application_id: string;
  tenant_name: string;
  property_address: string;
  agent_name: string;
  status: "pending_admin_signature" | "completed" | "draft";
  created_at: string;
  tenant_signed_at?: string;
  agent_signed_at?: string;
  admin_signed_at?: string;
}

export default function AdminAgreementSigningContent() {
  const router = useRouter();
  const { status } = useSession();
  const agentAxios = useAgentAxios();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadAgreements();
    }
  }, [status]);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get agreements that need admin signature
      const response = await agentAxios.get(
        "/forms/agreements/pending-admin-signature/"
      );
      setAgreements(response.data.data || []);
    } catch (err) {
      console.error("Failed to load agreements:", err);
      setError("Failed to load agreements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignAgreement = (agreement: Agreement) => {
    // Navigate to the agreement signing page with the application ID
    router.push(
      `/dashboard/agreement?applicationId=${agreement.application_id}`
    );
  };

  const getStatusBadge = (agreement: Agreement) => {
    switch (agreement.status) {
      case "pending_admin_signature":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending Admin Signature
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading Agreements...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-6xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Agreement Signing</h1>
          <p className="text-muted-foreground">
            Review and sign agreements that have been completed by tenants and
            agents/landlords. These agreements have already been signed by both
            tenant and landlord/agent.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {
                      agreements.filter(
                        (a) => a.status === "pending_admin_signature"
                      ).length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending Signatures
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {agreements.filter((a) => a.status === "completed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{agreements.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Agreements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agreements List */}
        <Card>
          <CardHeader>
            <CardTitle>Agreements Requiring Your Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {agreements.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No agreements pending
                </h3>
                <p className="text-gray-500">
                  There are currently no agreements waiting for your signature.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {agreements.map((agreement) => (
                  <div
                    key={agreement.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            Agreement #{agreement.application_id}
                          </h3>
                          {getStatusBadge(agreement)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Tenant:</strong> {agreement.tenant_name}
                          </div>
                          <div>
                            <strong>Agent/Landlord:</strong>{" "}
                            {agreement.agent_name}
                          </div>
                          <div>
                            <strong>Property:</strong>{" "}
                            {agreement.property_address}
                          </div>
                          <div>
                            <strong>Created:</strong>{" "}
                            {formatDate(agreement.created_at)}
                          </div>
                        </div>

                        {/* Signature Status */}
                        <div className="mt-3 flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">
                              Tenant Signed
                            </span>
                            {agreement.tenant_signed_at && (
                              <span className="text-gray-500">
                                ({formatDate(agreement.tenant_signed_at)})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">
                              Agent/Landlord Signed
                            </span>
                            {agreement.agent_signed_at && (
                              <span className="text-gray-500">
                                ({formatDate(agreement.agent_signed_at)})
                              </span>
                            )}
                          </div>
                          {agreement.admin_signed_at ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">
                                Admin Signed
                              </span>
                              <span className="text-gray-500">
                                ({formatDate(agreement.admin_signed_at)})
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className="text-yellow-600">
                                Admin Signature Required
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {agreement.status === "pending_admin_signature" && (
                          <Button
                            onClick={() => handleSignAgreement(agreement)}
                            className="bg-primary"
                          >
                            Sign Agreement
                          </Button>
                        )}
                        {agreement.status === "completed" && (
                          <Button
                            variant="outline"
                            onClick={() => handleSignAgreement(agreement)}
                          >
                            View Agreement
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
