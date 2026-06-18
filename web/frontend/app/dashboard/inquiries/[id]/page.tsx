"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LeaseSteps from "./lease-steps";
import FormsView from "@/components/forms/forms-view";
import { useSession } from "next-auth/react";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { chatType, Inquiry } from "@/types/propertyTypes";
import { toast } from "sonner";
import ChangeStatus from "./changeStatus";

// Function to get status badge color
function getStatusBadge(status: string) {
  switch (status) {
    case "resolved":
      return <Badge className="bg-green-500">Resolved</Badge>;
    case "under_discussion":
      return <Badge className="bg-primary">Under Discussion</Badge>;
    default:
      return <Badge className="bg-gray-500">{status}</Badge>;
  }
}

export default function InquiryDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const axios = useAgentAxios();
  const router = useRouter();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    inquiryId: number | null;
  }>({
    open: false,
    inquiryId: null,
  });

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newChat: chatType[] = [
        ...(inquiry?.chat || []),
        {
          sender: session?.role === "tenant" ? "tenant" : "landlord",
          message: (
            (e.target as HTMLFormElement).elements[0] as HTMLInputElement
          ).value,
        },
      ];
      await axios.put(
        `tenants/inquiries/${id}/`,
        {
          chat: newChat,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      setInquiry({ ...inquiry!, chat: newChat });
      (e.target as HTMLFormElement).reset();

      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleDeleteInquiry = async () => {
    if (!session?.access || !deleteConfirmation.inquiryId) return;

    try {
      await axios.delete(`tenants/inquiries/${deleteConfirmation.inquiryId}/`, {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });

      router.push("/dashboard/inquiries");

      toast.success("Your inquiry has been successfully removed.");
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast.error("Failed to remove inquiry. Please try again.");
    } finally {
      // Close the confirmation dialog
      setDeleteConfirmation({ open: false, inquiryId: null });
    }
  };

  const handleRefreshChat = async () => {
    if (!session?.access) return;

    try {
      const res = await axios.get("tenants/inquiries/", {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      const data = res.data;
      const updatedInquiry = data.data.find(
        (inquiry: any) => inquiry.id === Number(id)
      );

      if (updatedInquiry) {
        setInquiry(updatedInquiry);
        toast.success("Chat refreshed successfully");
      }
    } catch (error) {
      console.error("Error refreshing chat:", error);
      toast.error("Failed to refresh chat");
    }
  };

  useEffect(() => {
    if (!session?.access) return;
    async function fetchInquiryDetails() {
      setLoading(true);
      try {
        const res = await axios.get("tenants/inquiries/", {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        });

        const data = res.data;
        setInquiry(data.data.find((inquiry: any) => inquiry.id === Number(id)));
      } catch (error) {
        console.error("Error fetching inquiry details:", error);
        setError("Failed to load inquiry details");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchInquiryDetails();
    }
  }, [id, session]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        Loading inquiry details...
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="container mx-auto px-4 py-8">
        Error: {error || "Inquiry not found"}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground mb-1">
            Inquiry Details
          </h1>
          <h1 className="text-3xl font-bold">
            <span className="font-semibold">Subject:</span> {inquiry.subject}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              Inquiry #{inquiry.id} • Created{" "}
              {format(new Date(inquiry.createdAt), "PPP")}
            </p>
            {getStatusBadge(inquiry.status)}
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteConfirmation.open}
          onOpenChange={(open) =>
            setDeleteConfirmation({ ...deleteConfirmation, open })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Inquiry Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this inquiry? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {/* Warning about cascading deletions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Warning: Related Data Will Be Deleted</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Deleting this inquiry will also permanently remove:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc space-y-1">
                    <li>All application forms for this property and tenant</li>
                    <li>Guarantor forms and uploaded documents</li>
                    <li>Agreement forms and digital signatures</li>
                    <li>Any uploaded documents (NIC copies, proofs of employment, etc.)</li>
                    <li>Chat history and messages</li>
                  </ul>
                  <p className="text-sm text-yellow-700 mt-2 font-medium">
                    Note: If you have already created a lease from this inquiry, the lease and other related agreement data will remain intact.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteConfirmation({ open: false, inquiryId: null })
                }
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteInquiry}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Inquiry & Related Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="cursor-pointer text-blue-500 text-sm mr-3"
            onClick={handleRefreshChat}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            variant={"outline"}
            className=" cursor-pointer text-red-500  text-sm right-4"
            onClick={() =>
              setDeleteConfirmation({ open: true, inquiryId: inquiry.id })
            }
          >
            Delete Inquary
          </Button>

          <Button variant="outline" onClick={() => window.history.back()}>
            All Inquiries
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-[400px] overflow-y-auto pr-2 mb-4">
                {inquiry.chat.map((message: chatType, index: number) => {
                  const isTenant = message.sender === "tenant";
                  return (
                    <div
                      key={index}
                      className={`flex ${
                        isTenant ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          isTenant
                            ? " bg-primary-foreground text-white rounded-br-none"
                            : "bg-gray-100 rounded-bl-none"
                        }`}
                      >
                        <p>{message.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply form - disabled for now */}
              <div className="mt-6">
                <form
                  className="flex gap-2 items-center"
                  onSubmit={(e) => sendMessage(e)}
                >
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <Button type="submit" className="cursor-pointer">
                    Send
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Property ID: {inquiry.property.id}</p>
              <Separator className="my-4" />
              <p className="text-sm font-medium mb-2">Status</p>
              <p className="text-sm mb-2">{getStatusBadge(inquiry.status)}</p>

              {inquiry.status === "resolved" && session?.role === "tenant" ? (
                <>
                  <Separator className="" />
                  <LeaseSteps params={{ id: id }} inquiry={inquiry} />
                </>
              ) : session?.role === "landlord" || session?.role === "agent" ? (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm">Tenant ID: {inquiry.tenant}</p>
                  <Separator className="my-4" />
                  <h3 className=" font-semibold mb-2">Change Status</h3>
                  <ChangeStatus inquiry={inquiry} setInquiry={setInquiry} />
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forms View for Landlords and Agents */}
      {(session?.role === "landlord" || session?.role === "agent") && inquiry && (
        <div className="mt-6">
          <FormsView inquiry={inquiry} />
        </div>
      )}
    </div>
  );
}
