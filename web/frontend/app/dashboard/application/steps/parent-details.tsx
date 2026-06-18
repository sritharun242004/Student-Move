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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  postcode: z.string().min(1, "Post Code is required"),
  phone: z.string().min(1, "Home Telephone is required"),
  work_name: z.string().min(1, "Work Place Name is required"),
  work_address: z.string().min(1, "Work Address is required"),
  work_postcode: z.string().min(1, "Work Post Code is required"),
  work_phone: z.string().min(1, "Work Telephone is required"),
  relationship: z.enum(["Parent", "Guardian"]),
});

interface ParentDetailsProps {
  onNext: (data: { parent: z.infer<typeof formSchema> }) => void;
  formData: any;
}

export default function ParentDetails({
  onNext,
  formData,
}: ParentDetailsProps) {
  const agentAxios = useAgentAxios();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      postcode: "",
      phone: "",
      work_name: "",
      work_address: "",
      work_postcode: "",
      work_phone: "",
      relationship: "Parent",
    },
  });

  useEffect(() => {
    const fetchParentDetails = async () => {
      if (!formData.applicationId) return;

      try {
        const response = await agentAxios.get(
          `/forms/${formData.applicationId}/parent/`
        );
        if (response.data) {
          form.reset({
            name: response.data.name || "",
            address: response.data.address || "",
            postcode: response.data.postcode || "",
            phone: response.data.phone || "",
            work_name: response.data.work_name || "",
            work_address: response.data.work_address || "",
            work_postcode: response.data.work_postcode || "",
            work_phone: response.data.work_phone || "",
            relationship: response.data.relationship || "Parent",
          });
        }
      } catch (error) {
        console.error("Failed to fetch parent details", error);
      }
    };

    fetchParentDetails();
  }, [formData.applicationId, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await agentAxios.post(
        `/forms/${formData.applicationId}/parent/`,
        data
      );
      onNext({ parent: data });
    } catch (error) {
      console.error("Failed to submit parent details", error);
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
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
              <FormLabel>Address</FormLabel>
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
                <FormLabel>Post Code</FormLabel>
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
                <FormLabel>Home Telephone</FormLabel>
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
          name="relationship"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Relationship</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Parent" />
                    </FormControl>
                    <FormLabel className="font-normal">Parent</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Guardian" />
                    </FormControl>
                    <FormLabel className="font-normal">Guardian</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="work_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Place Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="work_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Address</FormLabel>
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
            name="work_postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Post Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="work_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Telephone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="ml-auto">
          Next
        </Button>
      </form>
    </Form>
  );
}
