import React from "react";
import RegisterForm from "./registerForm";

const SignUp: React.FC = () => {
  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h2 className="text-3xl font-bold">
            {" "}
            Sign Up | Student <span className="text-gray-600">Moves</span>{" "}
          </h2>
          <p className="text-gray-600">Create a new account on Student Moves</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default SignUp;
