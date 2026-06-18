"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Inquiry } from "@/types/propertyTypes";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandlordGuard } from "@/components/dashboard/landlord-guard";
import { useAgentAxios } from "@/hooks/useAgentAxios";

export default function InquiriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const axios = useAgentAxios();
  const [inquiriesData, setInquiriesData] = useState({
    status: "loading",
    message: "",
    data: [],
  });

  useEffect(() => {
    const fetchInquiries = async () => {
      if (!session?.access) return;

      try {
        const response = await axios.get("tenants/inquiries/");

        setInquiriesData({
          status: "success",
          message: "Inquiries fetched successfully",
          data: response.data.data || [],
        });
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        setInquiriesData({
          status: "error",
          message: "Failed to fetch inquiries",
          data: [],
        });
      }
    };

    fetchInquiries();
  }, [session]);

  if (inquiriesData.status === "loading") {
    return (
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">My Inquiries</h1>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-500">
            Loading inquiries...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <LandlordGuard>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Inquiries</h1>
            <p className="text-muted-foreground">
              View and manage your inquiries here.
            </p>
          </div>
        </div>

        {inquiriesData.status === "error" ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{inquiriesData.message}</p>
          </div>
        ) : inquiriesData.data.length === 0 ? (
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle>No Inquiries Available</CardTitle>
              <CardDescription>
                You don't have any inquiries at the moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Home className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-center mb-6">
                When you have inquiries, you'll be able to manage them here.
              </p>
              <Button onClick={() => router.push("/dashboard/properties")}>
                View Properties
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 ">
            {inquiriesData.data
              .sort(
                (a: Inquiry, b: Inquiry) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((inquiry: Inquiry) => (
                <Card
                  key={inquiry.id}
                  className="overflow-hidden relative cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/inquiries/${inquiry.id}`)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {inquiry.subject}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(inquiry.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <CardDescription>
                      <span className={`mr-2 text-gray-600`}>
                        Status:
                        <Badge
                          className={`ml-1 ${
                            inquiry.status === "resolved" ? "bg-green-500" : ""
                          }`}
                        >
                          {inquiry.status.charAt(0).toUpperCase() +
                            inquiry.status.slice(1)}
                        </Badge>
                      </span>{" "}
                      Inquiry #{inquiry.id} • Property ID: #
                      {inquiry.property?.id || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 h-full">
                      <div className="bg-muted p-3 pl-2 rounded-md flex gap-2">
                        <h4 className="text-sm font-medium mb-1">Property:</h4>
                        <p
                          className="text-sm hover:text-primary cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/properties/${inquiry.property.id}`
                            );
                          }}
                        >
                          {inquiry.property?.name || "View Property"},{" "}
                          {inquiry.property?.address}
                        </p>
                      </div>

                      {inquiry.chat?.length > 0 ? (
                        <div className="bg-muted p-3 pl-2 rounded-md">
                          <h4 className="text-sm font-medium mb-1">
                            Last Message:
                          </h4>
                          <p className="text-sm font-semibold">
                            <span className="font-normal">
                              {inquiry.chat[inquiry.chat.length - 1].sender ===
                              "tenant"
                                ? "Tenant : "
                                : "Landlord/Agent : "}
                            </span>
                            {inquiry.chat[inquiry.chat.length - 1].message}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm">
                          Awaiting response from landlord
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </LandlordGuard>
  );
}
