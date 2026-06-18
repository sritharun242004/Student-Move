"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Share2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { toast } from "sonner";

interface ShareGuarantorLinkProps {
  applicationId: number;
  className?: string;
}

interface ShareToken {
  id: number;
  token: string;
  share_url: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  accessed_at?: string;
}

export default function ShareGuarantorLink({ 
  applicationId, 
  className 
}: ShareGuarantorLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareToken, setShareToken] = useState<ShareToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const agentAxios = useAgentAxios();

  const generateShareLink = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      
      const response = await agentAxios.post(
        `/forms/application/${applicationId}/share-token/`
      );
      
      
      if (response.data.status === "success") {
        setShareToken(response.data.data);
        toast.success("Share link generated successfully!");
      } else {
        setError(response.data.message || "Failed to generate share link");
        toast.error("Failed to generate share link");
      }
    } catch (error: any) {
      console.error("Error generating share link:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);
      
      if (error.response?.status === 405) {
        setError("Method not allowed. Please ensure the backend server is running on http://localhost:8000");
      } else if (error.response?.status === 404) {
        setError("Application not found. Please check the application ID.");
      } else if (error.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setError("Cannot connect to backend server. Please ensure Django server is running on http://localhost:8000");
      } else {
        setError(error.response?.data?.message || "Failed to generate share link. Please try again.");
      }
      toast.error("Failed to generate share link");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link");
    }
  };

  const deactivateToken = async () => {
    if (!shareToken) return;
    
    try {
      setIsLoading(true);
      await agentAxios.delete(`/forms/share-token/${shareToken.id}/deactivate/`);
      setShareToken(null);
      toast.success("Share link deactivated successfully");
    } catch (error: any) {
      console.error("Error deactivating token:", error);
      toast.error("Failed to deactivate link");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFullShareUrl = (shareUrl: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${shareUrl}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={className}
          onClick={() => {
            setIsOpen(true);
            if (!shareToken) {
              generateShareLink();
            }
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Guarantor Form
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Guarantor Form</DialogTitle>
          <DialogDescription>
            Generate a secure link to share with your guarantor. They can fill out the form without creating an account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading && !shareToken && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Generating secure link...</span>
            </div>
          )}
          
          {shareToken && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Secure link generated successfully! This link will expire on {formatDate(shareToken.expires_at)}.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={getFullShareUrl(shareToken.share_url)}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(getFullShareUrl(shareToken.share_url))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">How it works:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Share this link with your guarantor via email, text, or other secure means</li>
                  <li>Your guarantor can access the form without creating an account</li>
                  <li>They can save progress and return to complete it later</li>
                  <li>You'll be notified when they submit the form</li>
                  <li>The link expires in 30 days for security</li>
                </ol>
              </div>
              
              {shareToken.accessed_at && (
                <Alert>
                  <AlertDescription>
                    Last accessed: {formatDate(shareToken.accessed_at)}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(getFullShareUrl(shareToken.share_url))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deactivateToken}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            </div>
          )}
          
          {!shareToken && !isLoading && (
            <Button 
              onClick={generateShareLink}
              className="w-full"
              disabled={isLoading}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}