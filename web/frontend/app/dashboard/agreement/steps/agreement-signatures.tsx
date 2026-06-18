"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { AgreementFormData, AgreementStepProps } from "../schemas";
import { useSession } from "next-auth/react";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { AgreementService } from "../service";

const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error("Invalid data URL");
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export default function AgreementSignatures({
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  onSubmit,
}: AgreementStepProps) {
  const mainForm = useFormContext<AgreementFormData>();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const agentAxios = useAgentAxios();
  const applicationId = searchParams.get("applicationId");

  const tenantSignatureRef = useRef<SignatureCanvas | null>(null);
  const adminSignatureRef = useRef<SignatureCanvas | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [tenantSaved, setTenantSaved] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [tenantSignatures, setTenantSignatures] = useState<any[]>([]);
  const [currentUserHasSigned, setCurrentUserHasSigned] = useState(false);
  const [currentUserSignature, setCurrentUserSignature] = useState<any>(null);
  const [tempTenantSignatureData, setTempTenantSignatureData] =
    useState<string>("");
  const [bondAmount, setBondAmount] = useState<string | null>(null);

  // User roles
  const isTenant = session?.role === "tenant";
  const isAgentOrLandlord =
    session?.role === "agent" ||
    session?.role === "landlord" ||
    session?.role === "admin";

  // Watch signature fields
  const adminSignature = mainForm.watch("admin_sign");

  // Fetch agreement and signatures on load
  useEffect(() => {
    const fetchAgreement = async () => {
      if (!applicationId) return;
      try {
        // Get agreement form
        const data = await AgreementService.getAgreementForm(
          applicationId,
          agentAxios
        );
        if (data?.admin_sign) {
          mainForm.setValue("admin_sign", data.admin_sign);
          setAdminSaved(true);
        }
        if (data?.admin_name) {
          mainForm.setValue("admin_name", data.admin_name);
        }

        // Get all tenant signatures
        const sigResponse = await agentAxios.get(
          `/forms/${applicationId}/agreement/tenant-signatures/`
        );

        if (sigResponse.data?.data?.tenant_signatures) {
          // Check if current user has already signed
          if (isTenant && session?.id) {
            // Convert both IDs to strings for comparison to handle type mismatches
            const currentUserId = String(session?.id);

            const userSignedObj = sigResponse.data.data.tenant_signatures.find(
              (sig: any) => String(sig.tenant_user_id) === currentUserId
            );

            if (userSignedObj) {
              // Current user has already signed - mark as signed
              setCurrentUserHasSigned(true);
              setCurrentUserSignature(userSignedObj);
              setTenantSaved(true);

              // Filter out current user from the "Other Tenants" display
              const otherTenantSignatures =
                sigResponse.data.data.tenant_signatures.filter(
                  (sig: any) => String(sig.tenant_user_id) !== currentUserId
                );
              setTenantSignatures(otherTenantSignatures);
            } else {
              // Current user hasn't signed yet - show all other tenants' signatures
              setCurrentUserHasSigned(false);
              setCurrentUserSignature(null);
              setTenantSignatures(sigResponse.data.data.tenant_signatures);
            }
          } else {
            // Not a tenant, show all signatures
            setTenantSignatures(sigResponse.data.data.tenant_signatures);
          }
        }

        // Fetch the application form to get bond amount
        const applicationResponse = await agentAxios.get(
          `/forms/application/${applicationId}/`
        );
        if (applicationResponse.data?.amount_of_bond) {
          setBondAmount(applicationResponse.data.amount_of_bond.toString());
        }
      } catch (error) {
        console.error("Error fetching agreement:", error);
      }
    };

    fetchAgreement();
    // Only depend on applicationId to prevent repeated calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const toAbsoluteUrl = (url?: string) => {
    if (!url) return url as any;
    return url.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_API_URL}${url}`
      : url;
  };

  const loadSignatureToCanvas = async (
    type: "tenant" | "admin",
    signatureData: string
  ) => {
    const pad =
      type === "tenant"
        ? tenantSignatureRef.current
        : adminSignatureRef.current;

    if (!pad || !signatureData) return;

    try {
      if (signatureData.startsWith("data:")) {
        pad.fromDataURL(signatureData);
      } else if (
        signatureData.startsWith("http") ||
        signatureData.startsWith("/")
      ) {
        const response = await fetch(
          signatureData.startsWith("/")
            ? `${process.env.NEXT_PUBLIC_API_URL}${signatureData}`
            : signatureData
        );
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          pad.fromDataURL(dataUrl);
        };
        if (blob) reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error(`Failed to restore ${type} signature:`, error);
    }
  };

  const clearSignature = (type: "tenant" | "admin") => {
    if (type === "tenant") {
      tenantSignatureRef.current?.clear();
      setTempTenantSignatureData("");
      setTenantSaved(false);
    } else if (type === "admin") {
      adminSignatureRef.current?.clear();
      mainForm.setValue("admin_sign", "");
      setAdminSaved(false);
    }
  };

  const saveSignature = async (type: "tenant" | "admin"): Promise<boolean> => {
    const pad =
      type === "tenant"
        ? tenantSignatureRef.current
        : adminSignatureRef.current;

    if (pad?.isEmpty()) {
      const fieldName = type === "tenant" ? "lead_tenant_sign" : "admin_sign";
      mainForm.setError(fieldName, {
        type: "manual",
        message: "Please sign before saving",
      });
      return false;
    }

    try {
      const canvas = pad?.getCanvas();
      if (!canvas) throw new Error("Canvas not available");

      const dataUrl = await new Promise<string>((resolve, reject) => {
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }, "image/png");
      });

      if (type === "tenant") {
        setTempTenantSignatureData(dataUrl);
      } else {
        const fieldName = "admin_sign";
        mainForm.setValue(fieldName, dataUrl);
      }

      if (type === "tenant") setTenantSaved(true);
      else if (type === "admin") setAdminSaved(true);

      return true;
    } catch (error) {
      console.error(`Error saving ${type} signature:`, error);
      return false;
    }
  };

  const handleSubmit = async () => {
    try {
      const formId = searchParams.get("applicationId");
      if (!formId) throw new Error("Application ID not found");

      // Upload tenant signature
      if (
        isTenant &&
        tempTenantSignatureData &&
        tempTenantSignatureData.startsWith("data:")
      ) {
        const signatureBlob = dataURLtoBlob(tempTenantSignatureData);
        const signatureFormData = new FormData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const uniqueFilename = `agreement_${formId}_tenant_signature_${timestamp}.png`;
        signatureFormData.append("signature", signatureBlob, uniqueFilename);
        signatureFormData.append("tenant_name", session?.firstName || "");
        signatureFormData.append("tenant_email", session?.user?.email || "");

        await AgreementService.saveTenantSignature(
          formId,
          signatureFormData,
          agentAxios
        );

        // Refresh tenant signatures and mark current user as signed
        const sigResponse = await agentAxios.get(
          `/forms/${formId}/agreement/tenant-signatures/`
        );
        if (sigResponse.data?.data?.tenant_signatures) {
          // Convert both IDs to strings for comparison
          const currentUserId = String(session?.user?.id);

          const userSignedObj = sigResponse.data.data.tenant_signatures.find(
            (sig: any) => String(sig.tenant_user_id) === currentUserId
          );

          if (userSignedObj) {
            // Set current user's signature info
            setCurrentUserSignature(userSignedObj);
            setCurrentUserHasSigned(true);

            // Filter out current user from the "Other Tenants" display
            const otherTenantSignatures =
              sigResponse.data.data.tenant_signatures.filter(
                (sig: any) => String(sig.tenant_user_id) !== currentUserId
              );
            setTenantSignatures(otherTenantSignatures);
          }

          setTempTenantSignatureData("");
        }
      }

      // Upload admin signature
      if (
        session?.role === "admin" &&
        adminSignature &&
        adminSignature.startsWith("data:")
      ) {
        const signatureBlob = dataURLtoBlob(adminSignature);
        const signatureFormData = new FormData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const uniqueFilename = `agreement_${formId}_admin_signature_${timestamp}.png`;
        signatureFormData.append("signature", signatureBlob, uniqueFilename);

        const adminName = mainForm.getValues("admin_name");
        if (!adminName?.trim()) {
          setNameError("Admin name is required");
          throw new Error("Admin name is required");
        }

        await AgreementService.saveAdminSignature(
          formId,
          signatureFormData,
          adminName,
          agentAxios
        );
      }

      onSubmit?.({} as any);
    } catch (error) {
      console.error("Error submitting signatures:", error);
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utility Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Fixed Term Tenancy Agreement Display */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4 text-center">
            UTILITIES INCLUSIVE AGREEMENT
          </h3>
          <div className="text-xs text-justify space-y-3 leading-relaxed">
            <p>
              <strong>IMPORTANT NOTICE</strong>
            </p>
            <p className="font-semibold">
              This agreement contains the terms and obligations of the
              Landlord/Agent/Company and the said. It sets out the promises made
              by the all-inclusive company to the tenant and by the tenant to
              the Landlord/Agent/Company. These promises are part of a legally
              binding contract and once any individual has signed the agreement,
              they become subject to the terms and conditions of the utilities
              inclusive contract agreement joint and severally with all tenants.
            </p>
            <p>
              You should read it carefully to ensure it contains everything you
              want and nothing that you are not prepared to agree to. Whilst
              every attempt has been made to compose this agreement using plain
              and intelligible language, it inevitably contains some legal terms
              or references.
            </p>
            <p>
              If either party does not understand this agreement or anything in
              it, it is strongly suggested you ask for an explanation before
              signing it. You might consider consulting a Solicitor, Citizens
              Advice Bureau, or Housing Advice Centre.
            </p>

            <p>
              <strong>PARTICULARS</strong>
            </p>
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>THIS AGREEMENT IS MADE BETWEEN</p>
            <p>Company: StudentMoves </p>
            <p>AND</p>
            <p>
              Tenant(s):{" "}
              {session?.role === "admin"
                ? tenantSignatures.length > 0
                  ? tenantSignatures
                      .map((sig) => sig.full_name || sig.tenant_user_name)
                      .join(", ")
                  : "____________________"
                : session?.firstName + " " + session?.lastName ||
                  session?.email ||
                  "____________________"}
            </p>
            <p>
              Address of Premises Let:{" "}
              {mainForm.watch("agent_address") || "____________________"}
            </p>
            <p>
              Together with all fixtures, fittings, furnishings, and effects as
              described in the signed inventory (if provided).
            </p>
            <p>
              Term: Commencing on the{" "}
              {mainForm.watch("start_date")
                ? (() => {
                    const date = new Date(mainForm.watch("start_date"));
                    const day = date.getDate();
                    const month = date.toLocaleString("default", {
                      month: "long",
                    });
                    const year = date.getFullYear();
                    return `${day}${
                      day === 1
                        ? "st"
                        : day === 2
                        ? "nd"
                        : day === 3
                        ? "rd"
                        : "th"
                    } day of ${month} ${year}`;
                  })()
                : "______ day of ____________ ____"}{" "}
              and ending on the{" "}
              {mainForm.watch("end_date")
                ? (() => {
                    const date = new Date(mainForm.watch("end_date"));
                    const day = date.getDate();
                    const month = date.toLocaleString("default", {
                      month: "long",
                    });
                    const year = date.getFullYear();
                    return `${day}${
                      day === 1
                        ? "st"
                        : day === 2
                        ? "nd"
                        : day === 3
                        ? "rd"
                        : "th"
                    } day of ${month} ${year}`;
                  })()
                : "______ day of ____________ ____"}
              .
            </p>
            <p>
              At the end of the fixed term, this tenancy will automatically
              continue as a periodic tenancy under the Renters' Rights Act 2025
              unless lawfully terminated by either party with proper notice.
            </p>
            <p>
              Rent: £{mainForm.watch("amount") || "_________"} per calendar
              month, payable in advance on the first day of each month. The
              first payment shall be made on or before the tenancy start date.
            </p>
            <p>
              Deposit: £{bondAmount || "_________"}, held as
              stakeholder in accordance with the Housing Act 2004 and protected
              within a government-approved tenancy deposit scheme. Prescribed
              information will be provided within thirty (30) days of payment.
            </p>
            <p>
              Utilities and Council Tax: Unless stated otherwise in writing,
              water, gas, electricity, broadband, and council tax are not
              included in the rent and remain the Tenant's responsibility.
            </p>

            <p>
              <strong>
                <u>Terms and Conditions</u>
              </strong>
            </p>
            <p>
              6. The tenants agree to use a fair, reasonable, and acceptable
              amount of energy during their tenancy and to ensure anyone else in
              the household or visitors to the property do the same.
            </p>
            <p>
              7. The all-inclusive company will decide which suppliers to use,
              and the tenants may not change suppliers without written consent
              from the landlord/landlady or all-inclusive company.{" "}
            </p>
            <p>
              8. All tenants need to be aware that a fair usage policy applies
              to the utility bills that are included. This is measured in line
              with the average UK usage for a similar-sized property and the
              number of occupants. If the usage gets close to the fair usage
              amount the tenants will be notified to consume energy accordingly.
            </p>
            <p>
              9. Take responsibility to ensure that any mains service
              disconnected due to the default of a previous Tenant is
              reconnected in a tenant's name. To put utilities in the tenant’s
              name for the change of a pre-payment meter back to a credit pay
              monthly meter which is required for the bills-inclusive package
              (after which the all-inclusive company can put into their name)
              The Landlord/Lady/Agent does not accept any liability for the
              disconnection of any service to the property at any time.{" "}
            </p>
            <p>
              10. Price increases may occur if any of said services have a price
              increase from the supplier. Named individuals will be notified 14
              days before any price increases and direct debit will need to be
              changed accordingly in line with the direct debit guarantee.{" "}
            </p>
            <p>
              11. The all-inclusive company/landlord is not responsible and will
              not provide any compensation for any failure in service caused by
              one of the suppliers or their equipment, they will however
              endeavor to help resolve any problems quickly to minimize any
              inconvenience caused to the tenants.{" "}
            </p>
            <p>
              12. Tenants will incur a charge if payments are returned from the
              bank as unpaid on the due dates. A charge of £25.00 and a further
              £10.00 will be incurred every 7 days thereafter until the full
              amount is paid. If a debt recovery agency is used, then the said
              individual will incur the debt recovery agency charges.{" "}
            </p>
            <p>
              13. If broadband is included unlimited broadband will be subject
              to the supplier’s fair usage policy and any costs incurred to the
              landlord for excessive usage will be passed on to the tenant. The
              landlord will forward any warnings received for excessive usage it
              receives from the suppliers to the tenants.{" "}
            </p>
            <p>
              14. If broadband is included the Agent/Landlord will not hold any
              liability for loss/reduction of service throughout the property.{" "}
            </p>
            <p>
              15. If any named signees incur action involving debt recovery
              agencies due to default payments, then the named signees will be
              responsible for all charges incurred.{" "}
            </p>
            <p>
              16. The responsibility for the payment of the total bills package
              amount lies jointly and severally with all tenants named in this
              agreement.{" "}
            </p>
            <p>
              17. If any appliances are damaged or broken due to misuse,
              incorrect use or not appropriately cleaned (for example the
              dishwasher filter) then the tenants will be liable for service,
              repair or replacement of the said item(s).{" "}
            </p>
            <p>
              18. Where the property comes with gas central heating, tenants are
              not to use electricity as a heat source unless this is provided.{" "}
            </p>
            <p>
              19. Utilities may be halted/cancelled if payments fall into
              arrears by any tenant.
            </p>
            <p>
              If Sky Tv is included then only the channels provided are to be
              watched, should any extra services be downloaded i.e. sports
              events, on-demand movies, etc, then the tenants will be liable for
              the costs.{" "}
            </p>
            <p>
              If Shared broadband is included, then this will have no bearing on
              the agent/landlord should service be interrupted.
            </p>

            <p>
              <strong>
                <u>Broadband terms and conditions</u>
              </strong>
            </p>
            <p>
              21. Please ensure that anyone using your account to access the
              broadband services agrees with this policy and is aware of their
              obligations under it. These terms and conditions are in addition
              to those of the broadband service provider to which you also
              implicitly agree by using their service. Banned activities.
            </p>
            <p>
              22. Unlawful, fraudulent, criminal, or otherwise illegal
              activities.
            </p>
            <p>
              23. Sending, receiving, publishing, posting, distributing,
              disseminating, encouraging the receipt of, uploading, downloading,
              recording, reviewing, streaming, or using any material which is
              offensive, abusive, defamatory, indecent, obscene, unlawful,
              harassing, or menacing or a breach of the copyright, trademark,
              intellectual property, confidence, privacy, or any other rights of
              any person.
            </p>
            <p>
              24. Sending or uploading unsolicited emails that advertise or
              promote materials, offer to sell any goods or services, or conduct
              or forward surveys, contests, or chain letters.
            </p>
            <p>
              25. Knowingly or negligently transmitting or uploading any
              electronic material (including, without limit, files that contain
              viruses, corrupted files, or any other similar software or
              programs) which is known or likely to cause, interrupt, damage,
              destroy, or limit the functionality of any computer software,
              hardware or telecommunications equipment owned by the landlord,
              supplier or any other internet user or person. The all-inclusive/
              landlord or landlady cannot guarantee broadband speeds if they
              fluctuate during the day.
            </p>
            <p>
              26. Activities that invade another's privacy cause annoyance,
              inconvenience, or needless anxiety to any person.
            </p>
            <p>
              27. Activities that are in breach of any other third party's
              rights, including downloading, installation, or distribution of
              pirated software or other inappropriately licensed software,
              deletion of any author attributions, legal notices, or proprietary
              designations or labels in any file that is uploaded, falsification
              of the origin or source of any software or other material.
            </p>
            <p>
              28. Anything that may disrupt or interfere with the network or
              services or cause a host or the network to crash.
            </p>
            <p>
              29. Launching "denial of service" attacks "mailbombing" attacks or
              "flooding" attacks against a host or network.
            </p>
            <p>
              30. Granting access to your Broadband Service to others not
              authorized by you.
            </p>
            <p>
              31. Circumventing the user authentication or security process of a
              host or network.
            </p>
            <p>
              32. Creating, transmitting, storing, or publishing any virus,
              Trojan, corrupting program or corrupted data.
            </p>
            <p>
              33. Monitoring or recording the actions of any person entitled to
              be in your home or business premises without their knowledge or
              any person or thing outside of your home or premises including,
              without limitation, any public highway or roadway or another
              person's home or business premises.
            </p>
            <p>
              34. Collecting, streaming, distributing, or accessing any material
              that you know, or reasonably should know, cannot be legally
              collected, streamed, distributed, or accessed. Security: you are
              responsible for ensuring that your usernames, passwords and login
              details for any broadband service or equipment remain confidential
              so that the network cannot be used by any unauthorized person
              including, but not limited to, those controlling access to (a) any
              computer hardware systems or networks; (b) any computer software
              or applications; or (c) any other services accessed by you in the
              use of either sample of the above. You shall not disclose these
              credentials to any third party or use the same for any purpose
              connected with the improper use of the network including accessing
              or attempting to access other parts of the services for which you
              do not have access rights.
            </p>
            <p>
              35. Broadband equipment will only be provided by the provider any
              Wi-Fi extenders will not be provided.
            </p>
            <p>
              36. You are responsible for taking all reasonable steps necessary
              to prevent a third party from obtaining access to the network. You
              must immediately advise us if you become aware of any violation or
              suspected violation of these security provisions. Other users; you
              are responsible for all uses made of the Broadband Service through
              your account (whether authorized or unauthorized) and for any
              breach of this policy whether an unacceptable use occurs or is
              attempted, whether you knew or should have known about it, whether
              or not you carried out or attempted the unacceptable use alone,
              contributed to or acted with others or allowed any unacceptable
              use to occur by omission.
            </p>
            <p>
              37. You agree that the all-inclusive company/landlord is not
              responsible for any of your activities in using the network.
              Although the internet is designed to appeal to a broad audience,
              it's your responsibility to determine whether any of the content
              accessed via the Broadband Service is appropriate for children or
              others in your household to view or use.
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Tenant Signatures Section */}
        {isTenant && (
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold">Your Signature</h3>

            {/* Show previous tenant signatures (other tenants only) */}
            {tenantSignatures.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-2">
                  Tenants Who Have Signed:
                </p>
                {tenantSignatures.map((sig, idx) => (
                  <div
                    key={sig.id}
                    className="text-sm mb-2 pl-2 border-l-4 border-blue-300"
                  >
                    <p className="font-medium">
                      {sig.full_name ||
                        sig.tenant_user_name ||
                        `Tenant ${idx + 1}`}
                    </p>
                    {sig.email && (
                      <p className="text-xs text-gray-600">
                        Email: {sig.email}
                      </p>
                    )}
                    {sig.phone && (
                      <p className="text-xs text-gray-600">
                        Phone: {sig.phone}
                      </p>
                    )}
                    {sig.sign && (
                      <img
                        src={toAbsoluteUrl(sig.sign)}
                        alt={`Tenant signature`}
                        className="max-h-20 mt-1 border rounded"
                      />
                    )}
                    <p className="text-xs text-gray-600">
                      Signed: {new Date(sig.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Show signature input if not already signed */}
            {!currentUserHasSigned ? (
              <div className="space-y-2">
                <label className="font-semibold text-green-700">
                  Your Signature (Required)
                </label>
                <p className="text-sm text-gray-600">
                  Please sign below to complete your part of the agreement
                </p>
                <div className="border-2 border-green-400 rounded-md p-2 w-[300px]">
                  <SignatureCanvas
                    ref={tenantSignatureRef}
                    canvasProps={{ className: "border w-full h-32 bg-white" }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => clearSignature("tenant")}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => await saveSignature("tenant")}
                      disabled={tenantSaved}
                    >
                      {tenantSaved ? "Saved ✓" : "Save Signature"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-400">
                <p className="text-sm font-semibold text-green-700 mb-2">
                  ✓ Your Signature Locked
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  You have successfully signed the agreement. Your signature
                  cannot be modified.
                </p>
                {currentUserSignature?.sign && (
                  <div className="border rounded-md p-2 bg-white">
                    <img
                      src={toAbsoluteUrl(currentUserSignature.sign)}
                      alt="Your signature"
                      className="max-h-20 object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin View - Show All Tenant Signatures */}
        {session?.role === "admin" && (
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold">All Tenant Signatures</h3>

            {tenantSignatures.length > 0 ? (
              <div className="space-y-3">
                {tenantSignatures.map((sig, idx) => (
                  <div
                    key={sig.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="font-medium text-sm">
                      {sig.full_name ||
                        sig.tenant_user_name ||
                        `Tenant ${idx + 1}`}
                    </p>
                    {sig.email && (
                      <p className="text-xs text-gray-600">
                        Email: {sig.email}
                      </p>
                    )}
                    {sig.phone && (
                      <p className="text-xs text-gray-600">
                        Phone: {sig.phone}
                      </p>
                    )}
                    {sig.sign && (
                      <img
                        src={toAbsoluteUrl(sig.sign)}
                        alt={`Tenant signature`}
                        className="max-h-24 mt-2 border rounded bg-white p-1"
                      />
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      Signed: {new Date(sig.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                No tenant signatures recorded yet.
              </p>
            )}
          </div>
        )}

        {/* Admin Signature Section */}
        {session?.role === "admin" && (
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold">Admin Signature</h3>
            {nameError && <p className="text-sm text-red-600">{nameError}</p>}
            <input
              type="text"
              required
              placeholder="Admin Name"
              {...mainForm.register("admin_name")}
              className="border p-2 w-full mb-2 text-sm"
            />

            {adminSignature && !adminSignature.startsWith("data:") ? (
              <div>
                <img
                  src={toAbsoluteUrl(adminSignature)}
                  alt="Admin signature"
                  className="max-h-32"
                />
                <p className="text-xs text-green-600 mt-1">✓ Already signed</p>
              </div>
            ) : (
              <div className="border-2 border-purple-400 rounded-md p-2 w-[300px]">
                <SignatureCanvas
                  ref={adminSignatureRef}
                  canvasProps={{ className: "border w-full h-32 bg-white" }}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => clearSignature("admin")}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => await saveSignature("admin")}
                    disabled={adminSaved}
                  >
                    {adminSaved ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {!isFirstStep && (
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
          )}
          {!isLastStep ? (
            <Button onClick={handleSubmit}>Next</Button>
          ) : (
            <Button onClick={handleSubmit}>Submit</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
