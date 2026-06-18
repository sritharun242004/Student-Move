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
  university: z.string().min(1, "University name is required"),
  student_id: z.string().min(1, "Student ID is required"),
  course_name: z.string().min(1, "Course name is required"),
  length: z.string().min(1, "Course length is required"),
  current_year: z.string().min(1, "Current year is required"),
  nin: z.string().min(1, "National Insurance Number is required"),
  loan_recieved: z.string().min(1, "Loan amount is required"),
});

type FormData = z.infer<typeof formSchema>;

interface StudentDetailsProps {
  onNext: (data: { student: FormData }) => void;
  formData: any;
}

export default function StudentDetails({
  onNext,
  formData,
}: StudentDetailsProps) {
  const agentAxios = useAgentAxios();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      university: "",
      student_id: "",
      course_name: "",
      length: "",
      current_year: "",
      nin: "",
      loan_recieved: "",
    },
  });

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!formData.applicationId) {
        console.error("No applicationId available in student details");
        return;
      }

      try {
        const response = await agentAxios.get(
          `/forms/${formData.applicationId}/student/`
        );
        if (response.data) {
          form.reset({
            university: response.data.university || "",
            student_id: response.data.student_id || "",
            course_name: response.data.course_name || "",
            length: response.data.length || "",
            current_year: response.data.current_year?.toString() || "",
            nin: response.data.nin || "",
            loan_recieved: response.data.loan_recieved?.toString() || "",
          });
        }
      } catch (error: any) {
        // It's okay if the data doesn't exist yet
        if (!error.response || error.response.status !== 404) {
          console.error("Failed to fetch student details", error);
        }
      }
    };

    fetchStudentDetails();
  }, [formData.applicationId]);

  const onSubmit = async (data: FormData) => {
    if (!formData.applicationId) {
      console.error(
        "No applicationId available for submitting student details"
      );
      return;
    }

    try {
      // Transform the data to the expected format
      const submitData = {
        ...data,
        current_year: Number(data.current_year),
        loan_recieved: Number(data.loan_recieved),
      };
      
      // Create/Update student details
      await agentAxios.post(`/forms/${formData.applicationId}/student/`, submitData);
      onNext({ student: data });
    } catch (error) {
      console.error("Failed to submit student details", error);
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
            name="university"
            render={({ field }) => (
              <FormItem>
                <FormLabel>University</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="student_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student ID</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="course_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Length</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 3 years" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Year</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National Insurance Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loan_recieved"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Loan Amount Received</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
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
