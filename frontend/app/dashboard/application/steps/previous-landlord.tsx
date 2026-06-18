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
  name: z.string().optional(),
  address: z.string().optional(),
  property_address: z.string().optional(),
  postcode: z.string().optional(),
  property_postcode: z.string().optional(),
  number_of_beds: z.string().optional(),
  current_rent: z.string().optional(),
  per_week: z.string().optional(),
  bond: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PreviousLandlordDetailsProps {
  onNext: (data: { previousLandlord: FormData }) => void;
  formData: any;
}

export default function PreviousLandlordDetails({
  onNext,
  formData,
}: PreviousLandlordDetailsProps) {
  const agentAxios = useAgentAxios();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      property_address: "",
      postcode: "",
      property_postcode: "",
      number_of_beds: "",
      current_rent: "",
      per_week: "",
      bond: "",
    },
  });

  useEffect(() => {
    const fetchParentDetails = async () => {
      if (!formData.applicationId) return;

      try {
        const response = await agentAxios.get(
          `/forms/${formData.applicationId}/landlord/`
        );
        if (response.data) {
          form.reset({
            name: response.data.name || "",
            address: response.data.address || "",
            property_address: response.data.property_address || "",
            postcode: response.data.postcode || "",
            property_postcode: response.data.property_postcode || "",
            number_of_beds: response.data.number_of_beds?.toString() || "",
            current_rent: response.data.current_rent?.toString() || "",
            per_week: response.data.per_week?.toString() || "",
            bond: response.data.bond?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch landlord details", error);
      }
    };

    fetchParentDetails();
  }, [formData.applicationId, form]);

  const onSubmit = async (data: FormData) => {
    try {
      // Transform numeric fields for API submission
      const submitData = {
        ...data,
        number_of_beds: data.number_of_beds ? Number(data.number_of_beds) : null,
        current_rent: data.current_rent ? Number(data.current_rent) : null,
        per_week: data.per_week ? Number(data.per_week) : null,
        bond: data.bond ? Number(data.bond) : null,
      };
      
      await agentAxios.post(`/forms/${formData.applicationId}/landlord/`, submitData);
      onNext({ previousLandlord: data });
    } catch (error) {
      console.error("Failed to submit landlord details", error);
    }
  };

  return (
    <Form {...form}>
      <div className="mb-6">
        <p className="text-gray-600 text-sm italic">
          If you don't have a previous landlord, please click next to continue.
        </p>
      </div>
      <form
        id="current-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Landlord Name</FormLabel>
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
                <FormLabel>Landlord&apos;s Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Landlord&apos;s Postcode</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="property_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Property Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="property_postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Property Postcode</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number_of_beds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Bedrooms</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_rent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Rent</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="per_week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rent per Week</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bond"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bond Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                  />
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
