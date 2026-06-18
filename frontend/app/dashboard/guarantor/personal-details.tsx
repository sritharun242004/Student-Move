"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "./components/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  guarantorPersonalDetailsSchema,
  type GuarantorPersonalDetails,
} from "./schemas";
import { GuarantorService } from "./service";

interface PersonalDetailsProps {
  handleNext: () => void;
  formId: string;
  onSave: (data: GuarantorPersonalDetails) => void;
  initialData?: Partial<GuarantorPersonalDetails>;
}

export default function PersonalDetails({
  handleNext,
  formId,
  onSave,
  initialData,
}: PersonalDetailsProps) {
  const form = useForm<GuarantorPersonalDetails>({
    resolver: zodResolver(guarantorPersonalDetailsSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: GuarantorPersonalDetails) => {
    try {
      await GuarantorService.saveGuarantorDetails(formId, data);
      onSave(data);
      handleNext();
    } catch (error) {
      console.error("Error saving guarantor details:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guarantor_name">Full Name</Label>
              <Input
                id="guarantor_name"
                {...form.register("guarantor_name")}
                error={form.formState.errors.guarantor_name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                {...form.register("occupation")}
                error={form.formState.errors.occupation?.message}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="home_address">Home Address</Label>
            <Input
              id="home_address"
              {...form.register("home_address")}
              error={form.formState.errors.home_address?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="work_address">Work Address</Label>
            <Input
              id="work_address"
              {...form.register("work_address")}
              error={form.formState.errors.work_address?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_at_address">Time at Address</Label>
              <Input
                id="time_at_address"
                {...form.register("time_at_address")}
                error={form.formState.errors.time_at_address?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previous_address">Previous Address</Label>
              <Input
                id="previous_address"
                {...form.register("previous_address")}
                error={form.formState.errors.previous_address?.message}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home_phone">Home Phone</Label>
              <Input
                id="home_phone"
                {...form.register("home_phone")}
                error={form.formState.errors.home_phone?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_phone">Work Phone</Label>
              <Input
                id="work_phone"
                {...form.register("work_phone")}
                error={form.formState.errors.work_phone?.message}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                {...form.register("mobile")}
                error={form.formState.errors.mobile?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal_email">Personal Email</Label>
              <Input
                id="personal_email"
                type="email"
                {...form.register("personal_email")}
                error={form.formState.errors.personal_email?.message}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
