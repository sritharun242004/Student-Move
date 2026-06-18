"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User, Calendar, PoundSterling, CheckCircle, Building, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { downloadFormAsPDF } from "@/lib/pdfUtils";

interface AgreementFormData {
  id: number;
  date?: string;
  agent?: string;
  agent_address?: string;
  start_date?: string;
  end_date?: string;
  amount?: number;
  payment_description?: string;
  completed: boolean;
  agent_filled: boolean;
  tenant_filled: boolean;
  filled_by_agent?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  land_lord_sign?: string;
  lead_tenant_sign?: string;
  lead_tenant_sign_1?: string;
  lls_date?: string;
  tenant_name?: string;
  property_address?: string;
  deposit_amount?: number;
  tenants?: Array<{
    id: number;
    full_name: string;
    tenant_user_name?: string;
    email?: string;
    phone?: string;
    sign?: string;
    sign_url?: string;
    date?: string;
  }>;
}

export default function AgreementFormView1() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AgreementFormViewContent1 />
    </Suspense>
  );
}

function AgreementFormViewContent1() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const leaseId = searchParams.get("leaseId");

  const [formData, setFormData] = useState<AgreementFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leaseId || !session?.access) return;

    const fetchFormData = async () => {
      try {
        const response = await Axios.get(`/forms/lease/${leaseId}/agreement/`, {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        });
        setFormData(response.data.data);
      } catch (error: any) {
        console.error("Error fetching agreement form:", error);
        toast.error("Failed to load agreement form data");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [leaseId, session?.access]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const toAbsoluteUrl = (url?: string) => {
    if (!url) return url as any;
    return url.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_API_URL}${url}`
      : url;
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadFormAsPDF('agreement-form-content', `rental-agreement-${leaseId}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('PDF download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading rental agreement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Rental Agreement Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The rental agreement for this lease could not be found.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" id="agreement-form-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rental Agreement</h1>
          <p className="text-muted-foreground">
            Final rental agreement details for lease #{leaseId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lease
          </Button>
        </div>
      </div>

      {/* Fixed Term Tenancy Agreement Display */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4 text-center">FINAL AGREEMENT DOCUMENT</h3>
            <p className="text-sm text-center mb-4">(Compliant with the Renters' Rights Act 2025)</p>
            
            <div className="text-xs text-justify space-y-3 leading-relaxed">
              <p><strong>IMPORTANT NOTICE</strong></p>
              <p>This Agreement sets out the full terms and obligations of the tenancy and the promises made by both the Landlord and the Tenant. Once signed and dated by both parties, it forms a legally binding contract enforceable through the courts of England and Wales.</p>
              <p>Please read this document carefully before signing to ensure that it contains everything you wish to agree and nothing you are unwilling to accept. If either party is uncertain about any clause, independent legal advice should be obtained from a solicitor, Citizens Advice Bureau, or Housing Advice Centre.</p>
              <p>When completed in handwriting, all information inserted must be legible and correct. Once executed, this Agreement becomes binding on both parties.</p>
              
              <p><strong>PARTICULARS</strong></p>
              <p>Date: {formData.date ? formatDate(formData.date) : new Date().toLocaleDateString()}</p>
              <p>THIS AGREEMENT IS MADE BETWEEN</p>
              <p>Landlord/Agent: {formData.agent || '____________________'}</p>
              <p>AND</p>
              <p>Tenant(s): {formData.tenants && formData.tenants.length > 0 ? formData.tenants.map(t => t.full_name || t.tenant_user_name).join(', ') : formData.tenant_name || '____________________'}</p>
              <p>Address of Premises Let: {formData.property_address || formData.agent_address || '____________________'}</p>
              <p>Together with all fixtures, fittings, furnishings, and effects as described in the signed inventory (if provided).</p>
              <p>Term: Commencing on the {formData.start_date ? (() => {
                const date = new Date(formData.start_date!);
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'long' });
                const year = date.getFullYear();
                return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} day of ${month} ${year}`;
              })() : '______ day of ____________ ____'} and ending on the {formData.end_date ? (() => {
                const date = new Date(formData.end_date!);
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'long' });
                const year = date.getFullYear();
                return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} day of ${month} ${year}`;
              })() : '______ day of ____________ ____'}.</p>
              <p>At the end of the fixed term, this tenancy will automatically continue as a periodic tenancy under the Renters' Rights Act 2025 unless lawfully terminated by either party with proper notice.</p>
              <p>Rent: £{formData.amount || '_________'} per calendar month, payable in advance on the first day of each month. The first payment shall be made on or before the tenancy start date.</p>
              <p>Deposit: £{formData.deposit_amount || formData.amount || '_________'}, held as stakeholder in accordance with the Housing Act 2004 and protected within a government-approved tenancy deposit scheme. Prescribed information will be provided within thirty (30) days of payment.</p>
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
        </CardContent>
      </Card>

      {/* Agreement Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agreement Information
          </CardTitle>
          <CardDescription>
            Details of the rental agreement between landlord and tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Agreement Date</label>
              <p className="text-lg">{formData.date ? formatDate(formData.date) : "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Monthly Rent Amount</label>
              <p className="text-lg font-medium flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                {formData.amount ? formatCurrency(formData.amount) : "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Lease Start Date</label>
              <p className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formData.start_date ? formatDate(formData.start_date) : "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Lease End Date</label>
              <p className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formData.end_date ? formatDate(formData.end_date) : "Not specified"}
              </p>
            </div>
          </div>

          {formData.payment_description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Payment Description</label>
              <p className="text-lg">{formData.payment_description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent/Landlord Information */}
      {(formData.agent || formData.agent_address) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Landlord Information
            </CardTitle>
            <CardDescription>
              Details of the landlord/agent managing this agreement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.agent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Landlord/Agent Name</label>
                  <p className="text-lg font-medium">{formData.agent}</p>
                </div>
              )}
              {formData.agent_address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-lg">{formData.agent_address}</p>
                </div>
              )}
              {formData.filled_by_agent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form Filled By</label>
                  <p className="text-lg">
                    {formData.filled_by_agent.first_name} {formData.filled_by_agent.last_name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenant Signatures Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tenant Signatures
          </CardTitle>
          <CardDescription>
            All tenants who have signed this rental agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!formData?.tenants || formData.tenants.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No tenant signatures recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4 grid grid-cols-2 space-x-2">
              {formData.tenants.map((tenant, idx) => (
                <div key={tenant.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">{tenant.full_name || tenant.tenant_user_name || 'Tenant'}</p>
                      {tenant.email && <p className="text-xs text-muted-foreground">Email: {tenant.email}</p>}
                      {tenant.phone && <p className="text-xs text-muted-foreground">Phone: {tenant.phone}</p>}
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  {(tenant.sign_url || tenant.sign) && (
                    <img
                      src={tenant.sign_url || tenant.sign}
                      alt={`Tenant signature - ${tenant.full_name || tenant.tenant_user_name}`}
                      className="max-h-24 border rounded bg-white p-1"
                    />
                  )}
                  {tenant.date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Signed: {formatDate(tenant.date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Landlord Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Landlord/Agent Signature
          </CardTitle>
          <CardDescription>
            Signature from the landlord or agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.land_lord_sign ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Signed by {formData.agent || 'Landlord/Agent'}
                </span>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={toAbsoluteUrl(formData.land_lord_sign)}
                  alt="Landlord/Agent signature"
                  className="max-h-24 mx-auto"
                />
              </div>
              {formData.lls_date && (
                <p className="text-xs text-muted-foreground text-center">
                  Signed on {formatDate(formData.lls_date)}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Not signed by landlord/agent yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agreement Progress
          </CardTitle>
          <CardDescription>
            Current status of the rental agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Agent/Landlord Details</span>
              <Badge variant={formData.agent_filled ? "default" : "secondary"}>
                {formData.agent_filled ? "Completed" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tenant Signatures</span>
              <Badge variant={formData.tenant_filled ? "default" : "secondary"}>
                {formData.tenant_filled ? "Completed" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Landlord/Agent Signature</span>
              <Badge variant={formData.land_lord_sign ? "default" : "secondary"}>
                {formData.land_lord_sign ? "Completed" : "Pending"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status</span>
              <Badge variant={formData.completed ? "default" : "secondary"}>
                {formData.completed ? "Completed" : "In Progress"}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Agreement ID: #{formData.id}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
