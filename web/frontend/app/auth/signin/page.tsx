import React from "react";
import LoginForm from "./loginForm";

const SignIn: React.FC = () => {
  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Sign In | Student Moves</h2>
          <p className="text-muted-foreground">Sign In to Your Account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default SignIn;
