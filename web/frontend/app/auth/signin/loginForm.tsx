"use client";

import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema, loginSchemaType } from "@/schemas/loginFormSchema";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const {
    handleSubmit,
    register,
    setError,
    formState: { errors },
  } = useForm<loginSchemaType>({
    resolver: zodResolver(loginSchema),
  });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // redirect to the nextAuth Function
  const submitData = async (data: loginSchemaType) => {
    try {
      setIsLoading(true);
      const response = await signIn("local-credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!response?.ok && response?.error) {
        setError("root.server", {
          message: response.error,
        });
        toast("Something went wrong!", {
          description: response.error,
        });
      } else {
        const activeSession = await getSession();

        if (activeSession?.role === "merchant") {
          router.push("/merchant-dashboard");
        } else {
          router.push("/dashboard/properties");
        }

        toast("Success", {
          description: "Logged in successfully!",
        });
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      setError("root.server", {
        message: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Form Submit Handler
  const onSubmitForm: SubmitHandler<loginSchemaType> = (data) =>
    submitData(data);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
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
        {errors.password && (
          <p className="text-sm font-medium text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full text-black" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-primary underline underline-offset-4"
        >
          Sign up
        </Link>
      </div>

      <div className="text-center text-xs text-muted-foreground -mt-4">
        Need a merchant account?{" "}
        <Link
          href="/auth/merchant-signup"
          className="font-medium text-primary underline underline-offset-4"
        >
          Register as merchant
        </Link>
      </div>
    </form>
  );
}
