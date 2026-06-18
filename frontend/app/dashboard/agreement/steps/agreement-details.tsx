"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAgentAxios } from "@/hooks/useAgentAxios";
import { agreementDetailsSchema, AgreementFormData, AgreementStepProps } from "../schemas";
import { AgreementService } from "../service";
import { useSession } from "next-auth/react";

export default function AgreementDetails({
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  onSubmit,
}: AgreementStepProps) {
  const mainForm = useFormContext<AgreementFormData>();
  const agentAxios = useAgentAxios();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const applicationId = searchParams.get("applicationId");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTenant = session?.role === "tenant";
  const isAgentOrLandlord = session?.role === "agent" || session?.role === "landlord" || session?.role === "admin";

  const form = useForm({
    resolver: zodResolver(agreementDetailsSchema),
    defaultValues: {
      agent: mainForm.getValues("agent") || "",
      agent_address: mainForm.getValues("agent_address") || "",
      start_date: mainForm.getValues("start_date") || undefined,
      end_date: mainForm.getValues("end_date") || undefined,
      amount: mainForm.getValues("amount") || "",
      payment_description: mainForm.getValues("payment_description") || "",
    },
  });

  const handleNext = async () => {
    // For tenants, skip validation and saving - just proceed to signatures
    if (isTenant) {
      onNext?.();
      return;
    }

    // For agents/landlords, validate and save as before
    const isValid = await form.trigger();
    if (!isValid) return;

    const formData = form.getValues();
    
    // Update main form
    mainForm.setValue("agent", formData.agent);
    mainForm.setValue("agent_address", formData.agent_address);
    mainForm.setValue("start_date", formData.start_date);
    mainForm.setValue("end_date", formData.end_date);
    mainForm.setValue("amount", formData.amount);
    mainForm.setValue("payment_description", formData.payment_description);

    if (!applicationId) {
      console.error("No application ID");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert dates to strings for API
      const apiData = {
        ...formData,
        start_date: formData.start_date?.toISOString().split('T')[0],
        end_date: formData.end_date?.toISOString().split('T')[0],
      };
      
      const result = await AgreementService.saveAgreementDetails(applicationId, apiData, agentAxios);
      
      // Move to next step
      onNext?.();
    } catch (error) {
      console.error("Error saving agreement details:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error("Error response:", (error as any).response?.data);
        console.error("Error status:", (error as any).response?.status);
        console.error("Error URL:", (error as any).config?.url);
      }
      form.setError("root", {
        type: "manual",
        message: "Failed to save agreement details. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreement Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tenant View-Only Alert */}
        {isTenant && (
          <Alert className="mb-6">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>View Only:</strong> The agreement details have been prepared by the agent/landlord. 
              You can review the terms below and proceed to add your signature.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="agent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Name {isAgentOrLandlord && "*"}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter agent name" 
                      {...field}
                      disabled
                      className={"bg-gray-100 cursor-not-allowed"}
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
                  <FormLabel>Property Address {isAgentOrLandlord && "*"}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter property address"
                      className={`min-h-[100px] bg-gray-100 cursor-not-allowed`}
                      {...field}
                      disabled
                    />
                  </FormControl>
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
                    <FormLabel>Lease Start Date {isAgentOrLandlord && "*"}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                              "bg-gray-100 cursor-not-allowed"
                            )}
                            disabled
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      {!isTenant && (
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      )}
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
                    <FormLabel>Lease End Date {isAgentOrLandlord && "*"}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                              isTenant && "bg-gray-100 cursor-not-allowed"
                            )}
                            disabled
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      {!isTenant && (
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const startDate = form.getValues("start_date");
                              return date < new Date() || (startDate && date <= startDate);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      )}
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent Amount (£) {isAgentOrLandlord && "*"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter monthly rent amount"
                      {...field}
                      disabled
                      className={"bg-gray-100 cursor-not-allowed"}
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
                  <FormLabel>Payment Description {isAgentOrLandlord && "(Optional)"}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter payment terms and conditions"
                      className={`min-h-[100px] bg-gray-100 cursor-not-allowed`}
                      {...field}
                      disabled={isTenant}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-red-500 text-sm">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex justify-between">
              {!isFirstStep && (
                <Button type="button" variant="outline" onClick={onPrevious}>
                  Previous
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="ml-auto"
              >
                {isSubmitting ? "Saving..." : isTenant ? "Continue to Signatures" : "Next"}
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}