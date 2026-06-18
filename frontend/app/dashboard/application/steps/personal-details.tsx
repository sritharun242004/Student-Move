"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Surname is required"),
  dob: z.date({
    required_error: "Date of Birth is required",
  }),
  home_address: z.string().min(1, "Home address is required"),
  postcode: z.string().min(1, "Post Code is required"),
  mobile: z.string().min(1, "Mobile telephone is required"),
  personal_email: z.string().email("Invalid email address"),
  rent_payer: z.string().min(1, "Please specify who will be paying the rent"),
  status: z.enum(["Student", "Employee"]),
});

interface PersonalDetailsProps {
  onNext: (data: {
    personal: z.infer<typeof formSchema>;
    applicationId?: string;
  }) => void;
  formData: any;
}

export default function PersonalDetails({
  onNext,
  formData,
}: PersonalDetailsProps) {
  const agentAxios = useAgentAxios();
  const { status } = useSession();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      dob: undefined,
      home_address: "",
      postcode: "",
      mobile: "",
      personal_email: "",
      rent_payer: "",
      status: "Student", // Set a default status instead of undefined
    },
  });

  useEffect(() => {
    const fetchPersonalDetails = async () => {
      if (!formData.applicationId || status !== 'authenticated') return;

      try {
        const response = await agentAxios.get(
          `/forms/application/${formData.applicationId}/`
        );
        if (response.data) {
          const data = response.data;
          form.reset({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            dob: data.dob ? new Date(data.dob) : undefined,
            home_address: data.home_address || "",
            postcode: data.postcode || "",
            mobile: data.mobile || "",
            personal_email: data.personal_email || "",
            rent_payer: data.rent_payer || "",
            status: data.status || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch personal details", error);
      }
    };

    // Fetch from API if applicationId exists
    if (formData.applicationId) {
      fetchPersonalDetails();
    }
    // Otherwise, load from formData.personal if it exists
    else if (formData.personal) {
      form.reset({
        ...formData.personal,
        dob: formData.personal.dob
          ? new Date(formData.personal.dob)
          : undefined,
      });
    }
  }, [formData.applicationId, formData.personal, status]); // Removed form from dependencies

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        ...data,
        dob: format(data.dob, "yyyy-MM-dd"),
      };
      let response;
      if (formData.applicationId) {
        // Update existing application
        response = await agentAxios.put(
          `/forms/application/${formData.applicationId}/`,
          payload
        );
        onNext({
          personal: data,
          applicationId: formData.applicationId,
        });
      } else {
        // Create new application
        const url = `/forms/apply/${formData.propertyId}/`;
        const params = formData.inquiryId ? { inquiry_id: formData.inquiryId } : {};
        
        response = await agentAxios.post(url, payload, {
          params: params
        });
        onNext({
          personal: data,
          applicationId: response.data.data.id,
        });
      }
    } catch (error) {
      console.error("Failed to submit personal details", error);
    }
  };

  return (
    <Form {...form}>
      <form
        id="current-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surname</FormLabel>
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
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={"w-1/3 pl-3 text-left font-normal"}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full overflow-hidden p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    className="rounded-md border block shadow-sm "
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="home_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home Address</FormLabel>
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
              <FormLabel>Post Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <FormField
            control={form.control}
            name="current_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telephone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Telephone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="personal_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* <FormField
          {/* <FormField
            control={form.control}
            name="work_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Working Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </div>

        <FormField
          control={form.control}
          name="rent_payer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Who will be paying your rent?</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Student" />
                    </FormControl>
                    <FormLabel className="font-normal">Student</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Employee" />
                    </FormControl>
                    <FormLabel className="font-normal">Employed</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="ml-auto">
          Next
        </Button>
      </form>
    </Form>
  );
}
