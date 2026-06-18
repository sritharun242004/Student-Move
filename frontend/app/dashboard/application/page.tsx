"use client";
import { Suspense } from "react";
import ApplicationPageContent from "./ApplicationPageContent";

export default function ApplicationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-2xl font-bold">Loading Application Form...</h1>
      </div>
    }>
      <ApplicationPageContent />
    </Suspense>
  );
}
