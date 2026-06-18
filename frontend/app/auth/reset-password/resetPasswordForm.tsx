"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Axios from "@/config/axios.config";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, EyeIcon, EyeOffIcon } from "lucide-react";

// Password schema - must match the requirements from registerFormSchema.ts
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Schema for the form
const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    otp: z
      .string()
      .min(6, "OTP must be 6 digits")
      .max(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must contain only numbers"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams?.get("email") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromUrl,
    },
  });

  useEffect(() => {
    if (emailFromUrl) {
      setValue("email", emailFromUrl);
    }
  }, [emailFromUrl, setValue]);

  const onSubmit: SubmitHandler<ResetPasswordFormType> = async (data) => {
    setIsLoading(true);
    try {
      // Call the API to reset password with OTP
      await Axios.patch("/users/update-password-otp/", {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });

      toast.success("Password has been reset successfully");

      // Redirect back to login
      router.push("/auth/signin");
    } catch (error: any) {
      console.error("Error resetting password:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "An error occurred. Please try again.";

      toast.error(errorMessage);
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
          disabled={!!emailFromUrl}
        />
        {errors.email && (
          <p className="text-sm font-medium text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Didn't receive the code? Please check your spam or junk folder.
        </p>
        <Input
          id="otp"
          {...register("otp")}
          placeholder="123456"
          maxLength={6}
          aria-invalid={!!errors.otp}
        />
        {errors.otp && (
          <p className="text-sm font-medium text-destructive">
            {errors.otp.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            {...register("newPassword")}
            placeholder="••••••••"
            aria-invalid={!!errors.newPassword}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 z-10"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
        {errors.newPassword && (
          <p className="text-sm font-medium text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 z-10"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showConfirmPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm font-medium text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-100">
          <p className="font-medium mb-1">Password Requirements:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>At least 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
          </ul>
        </div>
      </div>

      <Button type="submit" className="w-full text-black" disabled={isLoading}>
        {isLoading ? "Resetting Password..." : "Reset Password"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link
          href="/auth/signin"
          className="flex items-center text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to Login
        </Link>
        <Link
          href="/auth/forgot-password"
          className="text-primary hover:underline underline-offset-4"
        >
          Resend code
        </Link>
      </div>
    </form>
  );
}
