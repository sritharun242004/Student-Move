"use client";
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  activeStep: number;
  children: React.ReactNode;
  className?: string;
}

interface StepProps {
  children: React.ReactNode;
  completed?: boolean;
  active?: boolean;
}

interface StepLabelProps {
  children: React.ReactNode;
}

export const Stepper: React.FC<StepperProps> = ({
  activeStep,
  children,
  className,
}) => {
  const steps = React.Children.toArray(children);

  return (
    <div
      className={cn("relative flex justify-between items-center", className)}
    >
      <div
        className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200"
        aria-hidden="true"
      >
        <div
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{
            width: `${(activeStep / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            completed: index < activeStep,
            active: index === activeStep,
          });
        }
        return child;
      })}
    </div>
  );
};

export const Step: React.FC<StepProps> = ({ children, completed, active }) => {
  return (
    <div className="flex flex-col items-center relative z-10">
      <div
        className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 bg-white",
          active && "border-primary text-primary",
          completed && "border-green-500 bg-green-500 text-white",
          !active && !completed && "border-gray-300 text-gray-300"
        )}
      >
        {completed ? (
          <Check className="w-5 h-5" />
        ) : (
          <span className="text-sm font-medium">{active ? "●" : "○"}</span>
        )}
      </div>
      {children}
    </div>
  );
};

export const StepLabel: React.FC<StepLabelProps> = ({ children }) => {
  return <span className="text-sm font-medium">{children}</span>;
};
