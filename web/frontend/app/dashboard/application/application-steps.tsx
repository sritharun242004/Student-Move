"use client";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

interface Step {
  title: string;
  component: React.ComponentType<any>;
}

interface ApplicationStepsProps {
  steps: Step[];
  currentStep: number;
}

export default function ApplicationSteps({
  steps,
  currentStep,
}: ApplicationStepsProps) {
  return (
    <div className="relative">
      <div
        className="absolute top-5 left-0 w-full h-0.5 bg-gray-200"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>
      <ul className="relative flex justify-between">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300",
                index <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-200"
              )}
            >
              {index < currentStep ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </div>
            <span className="mt-2 text-sm font-medium">{step.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
