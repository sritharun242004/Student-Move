import React from "react";
import ForgotPasswordForm from "./forgotPasswordForm";

const ForgotPassword: React.FC = () => {
  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Forgot Password</h2>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset code
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPassword;
