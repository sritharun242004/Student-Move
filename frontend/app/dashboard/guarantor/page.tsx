"use client";

import { Suspense } from "react";
import GuarantorPageContent from "./GuarantorPageContent";

export default function GuarantorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading Guarantor Form...</h1>
          </div>
        </div>
      </div>
    }>
      <GuarantorPageContent />
    </Suspense>
  );
}
