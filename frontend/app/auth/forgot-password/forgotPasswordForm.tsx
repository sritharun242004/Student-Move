"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Axios from "@/config/axios.config";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Schema for the form
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormType = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormType>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormType> = async (data) => {
    setIsLoading(true);
    try {
      // Call the API to request password reset OTP
      await Axios.post("/users/reset-password-otp/", {
        email: data.email,
      });

      toast.success("Password reset code sent to your email");

      // Redirect to OTP verification page with email
      router.push(
        `/auth/reset-password?email=${encodeURIComponent(data.email)}`
      );
    } catch (error: any) {
      console.error("Error requesting password reset:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "An error occurred. Please try again.";

      toast.error(errorMessage);

      setError("email", {
        type: "manual",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="john.doe@example.com"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm font-medium text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full text-black" disabled={isLoading}>
        {isLoading ? "Sending reset code..." : "Send Reset Code"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link
          href="/auth/signin"
          className="flex items-center text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to Login
        </Link>
      </div>
    </form>
  );
}
