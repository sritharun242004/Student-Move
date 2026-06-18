"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  employer: z.string().min(1, "Employer name is required"),
  address: z.string().min(1, "Address is required"),
  postcode: z.string().min(1, "Postcode is required"),
  phone: z.string().min(1, "Phone number is required"),
  years: z.string().min(0),
  months: z.string().min(0),
  job_title: z.string().min(1, "Job Title is required"),
});

type FormData = z.infer<typeof formSchema>;

interface EmployeeDetailsProps {
  onNext: (data: { employee: FormData }) => void;
  formData: any;
}

export default function EmployeeDetails({
  onNext,
  formData,
}: EmployeeDetailsProps) {
  const agentAxios = useAgentAxios();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employer: "",
      address: "",
      postcode: "",
      phone: "",
      years: "",
      months: "",
      job_title: "",
    },
  });

  useEffect(() => {
    const fetchParentDetails = async () => {
      if (!formData.applicationId) return;

      try {
        const response = await agentAxios.get(
          `/forms/${formData.applicationId}/employee/`
        );
        if (response.data) {
          form.reset({
            employer: response.data.employer || "",
            address: response.data.address || "",
            postcode: response.data.postcode || "",
            phone: response.data.phone || "",
            years: response.data.years?.toString() || "",
            months: response.data.months?.toString() || "",
            job_title: response.data.job_title || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch employee details", error);
      }
    };

    fetchParentDetails();
  }, [formData.applicationId, form]);

  const onSubmit = async (data: FormData) => {
    try {
      // Transform numeric fields for API submission
      const submitData = {
        ...data,
        years: Number(data.years),
        months: Number(data.months),
      };
      
      await agentAxios.post(`/forms/${formData.applicationId}/employee/`, submitData);
      onNext({ employee: data });
    } catch (error) {
      console.error("Failed to submit employee details", error);
    }
  };

  return (
    <Form {...form}>
      <form
        id="current-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="employer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employer Post Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employer Telephone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="job_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Time with Current Employer</FormLabel>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <FormField
              control={form.control}
              name="years"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Months</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="ml-auto">
          Next
        </Button>
      </form>
    </Form>
  );
}
