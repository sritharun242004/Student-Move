"use client";

import { Suspense } from "react";
import AgreementPageContent from "./AgreementPageContent";

export default function AgreementPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading Agreement Form...</h1>
          </div>
        </div>
      </div>
    }>
      <AgreementPageContent />
    </Suspense>
  );
}