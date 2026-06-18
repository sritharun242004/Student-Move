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

export default function AgreementSignatures1({
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
  
  const [tenantSaved, setTenantSaved] = useState(false);
  const [tenantSignatures, setTenantSignatures] = useState<any[]>([]);
  const [currentUserHasSigned, setCurrentUserHasSigned] = useState(false);
  const [currentUserSignature, setCurrentUserSignature] = useState<any>(null);
  const [tempTenantSignatureData, setTempTenantSignatureData] = useState<string>("");
  const [landlordSignature, setLandlordSignature] = useState<string | null>(null);
  const [bondAmount, setBondAmount] = useState<string | null>(null);

  // User roles
  const isTenant = session?.role === "tenant";

  // Fetch agreement and signatures on load
  useEffect(() => {
    const fetchAgreement = async () => {
      if (!applicationId) return;
      try {
        // Get agreement form data
        const agreementResponse = await AgreementService.getAgreementForm(applicationId, agentAxios);
        if (agreementResponse) {
          // Check for landlord signature (step 1)
          if (agreementResponse.land_lord_sign) {
            setLandlordSignature(agreementResponse.land_lord_sign);
          }
        }

        // Get all tenant signatures for step 1
        const sigResponse = await agentAxios.get(`/forms/${applicationId}/agreement/tenant-signatures-1/`);
        
        if (sigResponse.data?.data?.tenant_signatures) {
          // Check if current user has already signed
          if (isTenant && session?.id) {
            // Convert both IDs to strings for comparison to handle type mismatches
            const currentUserId = String(session?.id);
            
            const userSignedObj = sigResponse.data.data.tenant_signatures.find((sig: any) => 
              String(sig.tenant_user_id) === currentUserId
            );
            
            if (userSignedObj) {
              // Current user has already signed - mark as signed
              setCurrentUserHasSigned(true);
              setCurrentUserSignature(userSignedObj);
              setTenantSaved(true);
              
              // Filter out current user from the "Other Tenants" display
              const otherTenantSignatures = sigResponse.data.data.tenant_signatures.filter(
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
            // Not a tenant (admin/agent), show all signatures
            setTenantSignatures(sigResponse.data.data.tenant_signatures);
          }
        }

        // Fetch the application form to get bond amount
        const applicationResponse = await agentAxios.get(`/forms/application/${applicationId}/`);
        if (applicationResponse.data?.amount_of_bond) {
          setBondAmount(applicationResponse.data.amount_of_bond.toString());
        }
        // console.log("bondAmount", applicationResponse)
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
    return url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL}${url}` : url;
  };

  const loadSignatureToCanvas = async (signatureData: string) => {
    const pad = tenantSignatureRef.current;
    
    if (!pad || !signatureData) return;
    
    try {
      if (signatureData.startsWith('data:')) {
        pad.fromDataURL(signatureData);
      } else if (signatureData.startsWith('http') || signatureData.startsWith('/')) {
        const response = await fetch(signatureData.startsWith('/') 
          ? `${process.env.NEXT_PUBLIC_API_URL}${signatureData}`
          : signatureData);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          pad.fromDataURL(dataUrl);
        };
        if (blob) reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error(`Failed to restore tenant signature:`, error);
    }
  };

  const clearSignature = () => {
    tenantSignatureRef.current?.clear();
    setTempTenantSignatureData("");
    setTenantSaved(false);
  };

  const saveSignature = async (): Promise<boolean> => {
    const pad = tenantSignatureRef.current;
    
    if (pad?.isEmpty()) {
      mainForm.setError("lead_tenant_sign_1", {
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
        }, 'image/png');
      });

      setTempTenantSignatureData(dataUrl);
      setTenantSaved(true);
      
      return true;
    } catch (error) {
      console.error(`Error saving tenant signature:`, error);
      return false;
    }
  };

  const handleSubmit = async () => {
    try {
      const formId = searchParams.get("applicationId");
      if (!formId) throw new Error("Application ID not found");

      // Upload tenant signature for step 1
      if (isTenant && tempTenantSignatureData && tempTenantSignatureData.startsWith('data:')) {
        const signatureBlob = dataURLtoBlob(tempTenantSignatureData);
        const signatureFormData = new FormData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueFilename = `agreement_${formId}_tenant_signature_1_${timestamp}.png`;
        signatureFormData.append("signature", signatureBlob, uniqueFilename);
        signatureFormData.append("tenant_name", session?.firstName || '');
        signatureFormData.append("tenant_email", session?.user?.email || '');
        
        await AgreementService.saveTenantSignature1(formId, signatureFormData, agentAxios);
        
        // Refresh tenant signatures and mark current user as signed
        const sigResponse = await agentAxios.get(`/forms/${formId}/agreement/tenant-signatures-1/`);
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
            const otherTenantSignatures = sigResponse.data.data.tenant_signatures.filter(
              (sig: any) => String(sig.tenant_user_id) !== currentUserId
            );
            setTenantSignatures(otherTenantSignatures);
          }
          
          setTempTenantSignatureData("");
        }
      }

      onNext?.();
    } catch (error) {
      console.error("Error submitting signatures:", error);
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Agreement Display - Customize this section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4 text-center">FINAL AGREEMENT DOCUMENT</h3>
          <p className="text-sm text-center mb-4">(Compliant with the Renters' Rights Act 2025)</p>
          
          <div className="text-xs text-justify space-y-3 leading-relaxed">
            <p><strong>IMPORTANT NOTICE</strong></p>
            <p>This Agreement sets out the full terms and obligations of the tenancy and the promises made by both the Landlord and the Tenant. Once signed and dated by both parties, it forms a legally binding contract enforceable through the courts of England and Wales.</p>
            <p>Please read this document carefully before signing to ensure that it contains everything you wish to agree and nothing you are unwilling to accept. If either party is uncertain about any clause, independent legal advice should be obtained from a solicitor, Citizens Advice Bureau, or Housing Advice Centre.</p>
            <p>When completed in handwriting, all information inserted must be legible and correct. Once executed, this Agreement becomes binding on both parties.</p>
            
            <p><strong>PARTICULARS</strong></p>
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>THIS AGREEMENT IS MADE BETWEEN</p>
            <p>Landlord/Agent: {mainForm.watch('agent') || '____________________'}</p>
            <p>AND</p>
            <p>Tenant(s): {
              session?.role === "admin" 
                ? (tenantSignatures.length > 0 
                    ? tenantSignatures.map(sig => sig.full_name || sig.tenant_user_name).join(', ')
                    : '____________________')
                : (session?.firstName + ' ' + session?.lastName || session?.email || '____________________')
            }</p>
            <p>Address of Premises Let: {mainForm.watch('agent_address') || '____________________'}</p>
            <p>Together with all fixtures, fittings, furnishings, and effects as described in the signed inventory (if provided).</p>
            <p>Term: Commencing on the {mainForm.watch('start_date') ? (() => {
              const date = new Date(mainForm.watch('start_date'));
              const day = date.getDate();
              const month = date.toLocaleString('default', { month: 'long' });
              const year = date.getFullYear();
              return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} day of ${month} ${year}`;
            })() : '______ day of ____________ ____'} and ending on the {mainForm.watch('end_date') ? (() => {
              const date = new Date(mainForm.watch('end_date'));
              const day = date.getDate();
              const month = date.toLocaleString('default', { month: 'long' });
              const year = date.getFullYear();
              return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} day of ${month} ${year}`;
            })() : '______ day of ____________ ____'}.</p>
            <p>At the end of the fixed term, this tenancy will automatically continue as a periodic tenancy under the Renters' Rights Act 2025 unless lawfully terminated by either party with proper notice.</p>
            <p>Rent: £{mainForm.watch('amount') || '_________'} per calendar month, payable in advance on the first day of each month. The first payment shall be made on or before the tenancy start date.</p>
            <p>Deposit: £{bondAmount || '_________'}, held as stakeholder in accordance with the Housing Act 2004 and protected within a government-approved tenancy deposit scheme. Prescribed information will be provided within thirty (30) days of payment.</p>
            <p>Utilities and Council Tax: Unless stated otherwise in writing, water, gas, electricity, broadband, and council tax are not included in the rent and remain the Tenant's responsibility.</p>
            
            <p><strong>1. GENERAL TERMS AND STATUS OF TENANCY</strong></p>
            <p>(1.1) This tenancy is granted under the Renters' Rights Act 2025, which replaces the Assured Shorthold Tenancy regime under the Housing Act 1988.</p>
            <p>(1.2) The tenancy is for the fixed period specified and will continue on a periodic (rolling) basis thereafter unless terminated by valid notice.</p>
            <p>(1.3) The Tenant shall occupy the property as a private residential dwelling only and not conduct any business, trade, or profession from it.</p>
            <p>(1.4) Where more than one Tenant is named, all Tenants are jointly and severally liable for rent and obligations under this Agreement.</p>
            
            <p><strong>2. COUNCIL TAX AND UTILITIES</strong></p>
            <p>(2.1) The Tenant shall be responsible for all council tax, gas, electricity, water, broadband, and other utilities during the tenancy unless agreed otherwise in writing.</p>
            <p>(2.2) The Tenant shall register all accounts in their own name, take accurate meter readings at the start and end of the tenancy, and provide proof of settlement to the Landlord or Agent when vacating.</p>
            <p>(2.3) The Tenant shall not tamper with meters, wiring, or installations. Any damage or interference will make the Tenant liable for all related costs.</p>
            
            <p><strong>3. SEPARATE UTILITIES AGREEMENT</strong></p>
            <p>(3.1) The Tenant acknowledges and agrees that utilities may be supplied under a separate independent contract between the Tenant and an external utilities company not affiliated with the Landlord or Agent.</p>
            <p>(3.2) The Landlord and Agent accept no responsibility for the management, billing, or pricing of such services. Disputes or arrears under that separate Utilities Agreement shall not constitute a breach of this Tenancy unless they cause damage or service interruption to the property.</p>
            
            <p><strong>4. WATER RATE ADJUSTMENTS</strong></p>
            <p>(4.1) If water charges increase during the tenancy, the Tenant shall pay the increased rate unless the rent expressly includes water charges. Where it is included, the Landlord may reasonably adjust the rent on giving one month's written notice.</p>
            
            <p><strong>5. RENT REVIEW</strong></p>
            <p>(5.1) In line with the Renters' Rights Act 2025, rent may be increased no more than once in any twelve-month period, and only after at least two months' written notice.</p>
            <p>(5.2) The Tenant may refer any disputed rent increase to the First-Tier Tribunal (Property Chamber) for review.</p>
            
            <p><strong>6. DEPOSIT</strong></p>
            <p>(6.1) The deposit shall be held as stakeholder under the Housing Act 2004. It may be used for unpaid rent, damages (beyond fair wear and tear), missing items, cleaning, or other proven breaches of this Agreement.</p>
            <p>(6.2) The deposit shall not be used by the Tenant to pay rent.</p>
            <p>(6.3) At the end of the tenancy, the deposit will be returned once the property has been inspected and proof of all utility account settlements provided.</p>
            <p>(6.4) Any disputes regarding deductions will be handled by the Tenancy Deposit Scheme's dispute resolution service, whose decision shall be final.</p>
            
            <p><strong>7. TENANT OBLIGATIONS</strong></p>
            <p>(7.1) Pay rent in full and on time. Late payments exceeding fourteen (14) days may incur interest at 3% above the Bank of England base rate, consistent with the Tenant Fees Act 2019.</p>
            <p>(7.2) Keep the property clean and in good condition. Replace consumables such as bulbs, batteries, and vacuum bags.</p>
            <p>(7.3) Do not make alterations or install fittings without written consent.</p>
            <p>(7.4) Keep doors and windows locked when absent and report defects or damage promptly.</p>
            <p>(7.5) Maintain any garden or outdoor area in neat order.</p>
            <p>(7.6) Dispose of rubbish responsibly and do not block drains or pipes.</p>
            
            <p><strong>8. SUBLETTING AND OCCUPATION</strong></p>
            <p>(8.1) The Tenant shall not sublet, assign, or share occupation without written consent.</p>
            <p>(8.2) Unauthorised subletting or room-sharing will be treated as a serious breach and may lead to possession proceedings.</p>
            
            <p><strong>9. PETS</strong></p>
            <p>(9.1) The Tenant may request permission to keep a pet, which the Landlord must consider reasonably and may not unreasonably refuse.</p>
            <p>(9.2) Permission may include conditions such as professional cleaning, higher deposit, or insurance requirements.</p>
            <p>(9.3) If the pet causes damage or nuisance, consent may be withdrawn on reasonable notice.</p>
            
            <p><strong>10. CONDUCT AND NUISANCE</strong></p>
            <p>(10.1) The Tenant shall not cause nuisance, annoyance, or disturbance to neighbours or others in the vicinity.</p>
            <p>(10.2) Noise must be kept to reasonable levels, especially between 11 pm – 7 am.</p>
            <p>(10.3) The Tenant shall not engage in antisocial, threatening, or harassing behaviour.</p>
            <p>(10.4) Any serious or repeated breach of these obligations may constitute grounds for possession under the Renters' Rights Act 2025.</p>
            
            <p><strong>11. ILLEGAL OR UNLAWFUL USE</strong></p>
            <p>(11.1) The Tenant shall not use or permit the property to be used for any illegal or immoral purpose.</p>
            <p>(11.2) The Tenant shall not store, supply, or use controlled drugs or prohibited substances under the Misuse of Drugs Act 1971.</p>
            <p>(11.3) Burning candles, incense, or oil lamps is prohibited without written consent.</p>
            
            <p><strong>12. LANDLORD'S ENTRY</strong></p>
            <p>(12.1) The Landlord or Agent may enter the property with at least 24 hours' written notice for inspection, repair, or safety checks.</p>
            <p>(12.2) In an emergency (fire, gas leak, water escape, or safety risk) entry may be made without notice.</p>
            <p>(12.3) During the final two months of tenancy, access may be granted for viewings at reasonable times with prior notice.</p>
            
            <p><strong>13. REPAIRS AND MAINTENANCE</strong></p>
            <p>(13.1) The Landlord shall keep in repair the structure, exterior, installations for water, gas, electricity, and sanitation in accordance with the Landlord and Tenant Act 1985 and the Decent Homes Standard introduced by the Renters' Rights Act 2025.</p>
            <p>(13.2) The Tenant must promptly report any defect or hazard. Failure to do so may make the Tenant liable for consequential damage.</p>
            
            <p><strong>14. RENT BIDDING AND FAIR ADVERTISING</strong></p>
            <p>(14.1) The Landlord or Agent shall not advertise the property with a false rent or engage in "bidding wars." The advertised rent shall be the actual payable rent.</p>
            
            <p><strong>15. LANDLORD REGISTRATION AND OMBUDSMAN</strong></p>
            <p>(15.1) The Landlord confirms registration on the Private Rented Sector Database and provides the registration reference to the Tenant.</p>
            <p>(15.2) The Landlord is a member of the Private Rented Sector Ombudsman as required by the Renters' Rights Act 2025.</p>
            <p>(15.3) Either party may refer unresolved complaints to the Ombudsman after exhausting the internal complaints process.</p>
            
            <p><strong>16. BREACH AND POSSESSION</strong></p>
            <p>(16.1) If rent is unpaid for more than 14 days or the Tenant seriously breaches obligations, the Landlord may seek possession only on statutory grounds permitted under Schedule 2 of the Housing Act 1988 (as amended) and the Renters' Rights Act 2025.</p>
            <p>(16.2) The Landlord may not evict or re-enter the property without a valid court order.</p>
            
            <p><strong>17. END OF TENANCY AND RETURN OF POSSESSION</strong></p>
            <p>(17.1) At the end of the tenancy, the Tenant shall:</p>
            <p>Leave the property clean and in tenantable condition. Remove all personal belongings and rubbish. Provide closing utility readings and proof of final payments. Return all keys and access fobs by 12 noon on the final day.</p>
            <p>(17.2) Items left behind may be treated as abandoned after 14 days and disposed of, with reasonable costs deducted from the deposit.</p>
            
            <p><strong>18. STATUTORY NOTICES</strong></p>
            <p>(18.1) The Tenant shall promptly forward any notice from a local authority or utility supplier that affects the property.</p>
            <p>(18.2) Notices to the Landlord shall be served at the address shown in this Agreement or any updated address notified in writing.</p>
            
            <p><strong>19. GOVERNING LAW</strong></p>
            <p>This Agreement shall be governed by and construed in accordance with the laws of England and Wales, and both parties submit to the exclusive jurisdiction of the English courts.</p>
            
            <p><strong>20. TENANT'S DECLARATION</strong></p>
            <p>The Tenant(s) declare that they have read and understood this Agreement in full, agree to comply with all terms, and confirm that:</p>
            <p>They are jointly and severally liable for all rent and obligations; They have received or will receive copies of all legally required documents (How to Rent guide, Gas Safety Certificate, EPC, Deposit Prescribed Information); They understand that utilities are governed by a separate independent contract.</p>
            
            <p><strong>21. LANDLORD / AGENT DECLARATION</strong></p>
            <p>The Landlord or Agent confirms that:</p>
            <p>The property is fit for human habitation and compliant with all safety legislation; All statutory certificates are valid; They are registered on the Private Rented Sector Database and subscribed to the Ombudsman.</p>
            
            <p><strong>SPECIAL OR ADDITIONAL CLAUSES (IF ANY)</strong></p>
            <p>Examples:</p>
            <p>Permission to keep a pet under specified conditions. No smoking inside the property. Rent review clause upon renewal. Additional cleaning or maintenance requirements.</p>
            <p>If none apply, draw a line through this section and initial by both parties.</p>
            
            <p><strong>FINAL ACKNOWLEDGEMENT</strong></p>
            <p>Both parties confirm that this Agreement represents the entire understanding between them and that no verbal promises or representations are binding unless written herein.</p>
          </div>
        </div>

        <Separator className="my-6" />
        {isTenant && (
          <div className="space-y-4 mb-8">
            
            {/* Show previous tenant signatures (other tenants only) */}
            {tenantSignatures.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-2">Tenants Who Have Signed:</p>
                {tenantSignatures.map((sig, idx) => (
                  <div key={sig.id} className="text-sm mb-2 pl-2 border-l-4 border-blue-300">
                    <p className="font-medium">{sig.full_name || sig.tenant_user_name || `Tenant ${idx + 1}`}</p>
                    {sig.email && <p className="text-xs text-gray-600">Email: {sig.email}</p>}
                    {sig.phone && <p className="text-xs text-gray-600">Phone: {sig.phone}</p>}
                    {sig.sign && (
                      <img src={toAbsoluteUrl(sig.sign)} alt={`Tenant signature`} className="max-h-20 mt-1 border rounded" />
                    )}
                    <p className="text-xs text-gray-600">Signed: {new Date(sig.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Show signature input if not already signed */}
            {!currentUserHasSigned ? (
              <div className="space-y-2">
                <label className="font-semibold text-green-700">Your Signature (Required)</label>
                <p className="text-sm text-gray-600">Please sign below for the first agreement</p>
                <div className="border-2 border-green-400 rounded-md p-2 w-[300px]">
                  <SignatureCanvas
                    ref={tenantSignatureRef}
                    canvasProps={{ className: "border w-full h-32 bg-white" }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => clearSignature()}>
                      Clear
                    </Button>
                    <Button type="button" size="sm" onClick={async () => await saveSignature()} disabled={tenantSaved}>
                      {tenantSaved ? "Saved ✓" : "Save Signature"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-400">
                <p className="text-sm font-semibold text-green-700 mb-2">✓ Your Signature Locked</p>
                <p className="text-sm text-gray-600 mb-3">You have successfully signed the first agreement. Your signature cannot be modified.</p>
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
                  <div key={sig.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-sm">{sig.full_name || sig.tenant_user_name || `Tenant ${idx + 1}`}</p>
                    {sig.email && <p className="text-xs text-gray-600">Email: {sig.email}</p>}
                    {sig.phone && <p className="text-xs text-gray-600">Phone: {sig.phone}</p>}
                    {sig.sign && (
                      <img src={toAbsoluteUrl(sig.sign)} alt={`Tenant signature`} className="max-h-24 mt-2 border rounded bg-white p-1" />
                    )}
                    <p className="text-xs text-gray-600 mt-1">Signed: {new Date(sig.date).toLocaleDateString()}</p>
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

        {/* Landlord/Agent Signature Preview */}
        {landlordSignature && (
          <div className="mb-6 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
            <h3 className="text-lg font-semibold mb-4 text-center text-blue-800">Landlord/Agent Signature</h3>
            <div className="flex justify-center">
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <img 
                  src={toAbsoluteUrl(landlordSignature)} 
                  alt="Landlord/Agent signature" 
                  className="max-h-24 object-contain" 
                />
              </div>
            </div>
            <p className="text-sm text-center text-gray-600 mt-2">Landlord/Agent has signed this agreement</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {!isFirstStep && (
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
          )}
          <Button onClick={handleSubmit}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}
