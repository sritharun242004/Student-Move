"use client";

import { Suspense } from "react";
import AdminAgreementSigningContent from "./AdminAgreementSigningContent";

export default function AdminAgreementSigningPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading Agreement Signing...</h1>
          </div>
        </div>
      </div>
    }>
      <AdminAgreementSigningContent />
    </Suspense>
  );
}