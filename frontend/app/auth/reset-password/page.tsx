import React, { Suspense } from "react";
import ResetPasswordForm from "./resetPasswordForm";

const ResetPassword: React.FC = () => {
  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Reset Password</h2>
          <p className="text-muted-foreground">
            Enter the code sent to your email along with your new password
          </p>
        </div>
        <Suspense fallback={<div>Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
};

export default ResetPassword;
