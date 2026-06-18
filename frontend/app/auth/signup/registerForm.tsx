"use client";

import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { FormError } from "@/types/errorTypes";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import {
  registerSchema,
  registerSchemaType,
} from "@/schemas/registerFormSchema";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { RoleSelector } from "./roleSelector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const {
    handleSubmit,
    register,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<registerSchemaType>({
    resolver: zodResolver(registerSchema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // submit form function
  const submitData = async (data: registerSchemaType) => {
    const { rePassword, ...postData } = data;
    try {
      await Axios.post("/auth/register/", postData);
      router.push("/auth/signin");
    } catch (error) {
      if ((error as AxiosError<FormError>).response) {
        const errorData = (error as AxiosError<FormError>).response?.data;
        setError(errorData!.field as keyof registerSchemaType, {
          message: errorData?.message,
        });
        toast("Something went wrong!", {
          description: errorData?.message,
        });
      } else {
        console.error("Error submitting the form:", error);
        toast("Server Error!", {
          description: "An error occurred, please try again later",
        });
      }
    }
  };

  // submit handler
  const onSubmitForm: SubmitHandler<registerSchemaType> = (data) =>
    submitData(data);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <RoleSelector control={control} error={errors.role?.message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="John"
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && (
            <p className="text-sm font-medium text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Doe"
            aria-invalid={!!errors.lastName}
          />
          {errors.lastName && (
            <p className="text-sm font-medium text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="mobileNumber">Mobile Number</Label>
        <Input
          id="mobileNumber"
          {...register("phone")}
          placeholder="07123456789"
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-sm font-medium text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
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
            {errors.password && (
              <p className="text-sm font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("rePassword")}
                placeholder="••••••••"
                aria-invalid={!!errors.rePassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
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
            {errors.rePassword && (
              <p className="text-sm font-medium text-destructive">
                {errors.rePassword.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full text-black"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <div className="text-center text-sm -mt-5">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-primary hover:text-primary underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>

      <div className="text-center text-xs text-muted-foreground -mt-4">
        Registering as a business?{" "}
        <Link
          href="/auth/merchant-signup"
          className="font-medium text-primary underline underline-offset-4"
        >
          Merchant registration
        </Link>
      </div>
    </form>
  );
}
