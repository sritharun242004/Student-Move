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
  admin_sign?: string;
  lls_date?: string;
  tenant_name?: string;
  property_address?: string;
  deposit_amount?: number;
  admin_name?: string;
  admin_sign_date?: string;
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

export default function AgreementFormView() {
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
      <AgreementFormViewContent />
    </Suspense>
  );
}

function AgreementFormViewContent() {
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
      await downloadFormAsPDF('agreement-form-content', `agreement-form-${leaseId}.pdf`);
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
            <p className="text-muted-foreground">Loading agreement form...</p>
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
          <h2 className="text-xl font-semibold mb-2">Agreement Form Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The agreement form for this lease could not be found.
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
          <h1 className="text-3xl font-bold">Lease Agreement</h1>
          <p className="text-muted-foreground">
            Final lease agreement details for lease #{leaseId}
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
            <h3 className="text-lg font-semibold mb-4 text-center">UTILITIES INCLUSIVE AGREEMENT</h3>
            <p className="text-sm text-center mb-4">(Compliant with the Renters' Rights Act 2025)</p>
            
            <div className="text-xs text-justify space-y-3 leading-relaxed">
              <p><strong>IMPORTANT NOTICE</strong></p>
              <p>This Agreement contains the full terms and obligations of the tenancy and the promises made by both the Landlord/Agent and the Tenant. Once signed and dated by both parties, it forms a legally binding contract enforceable through the courts of England and Wales.</p>
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
              <p>Utilities and Council Tax: All utilities including water, gas, electricity, broadband, and council tax are INCLUDED in the rent as per the utilities inclusive agreement terms below.</p>
              
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
              If Sky Tv is included then only the channels provided are to
              be watched, should any extra services be downloaded i.e. sports
              events, on-demand movies, etc, then the tenants will be liable for
              the costs.{" "}
            </p>
            <p>
              If Shared broadband is included, then this will have no bearing on
              the agent/landlord should service be interrupted.
            </p>

            <p>
              <strong><u>Broadband terms and conditions</u></strong>
            </p>
            <p>
              21. Please ensure that anyone using your account to access the broadband services agrees with
              this policy and is aware of their obligations under it. These terms and conditions are in addition
              to those of the broadband service provider to which you also implicitly agree by using their
              service. Banned activities.
            </p>
            <p>
              22. Unlawful, fraudulent, criminal, or otherwise illegal activities.
            </p>
            <p>
              23. Sending, receiving, publishing, posting, distributing, disseminating, encouraging the receipt of,
              uploading, downloading, recording, reviewing, streaming, or using any material which is
              offensive, abusive, defamatory, indecent, obscene, unlawful, harassing, or menacing or a
              breach of the copyright, trademark, intellectual property, confidence, privacy, or any other
              rights of any person.
            </p>
            <p>
              24. Sending or uploading unsolicited emails that advertise or promote materials, offer to sell any
              goods or services, or conduct or forward surveys, contests, or chain letters.
            </p>
            <p>
              25. Knowingly or negligently transmitting or uploading any electronic material (including, without
              limit, files that contain viruses, corrupted files, or any other similar software or programs)
              which is known or likely to cause, interrupt, damage, destroy, or limit the functionality of any
              computer software, hardware or telecommunications equipment owned by the landlord,
              supplier or any other internet user or person. The all-inclusive/ landlord or landlady cannot
              guarantee broadband speeds if they fluctuate during the day.
            </p>
            <p>
              26. Activities that invade another's privacy cause annoyance, inconvenience, or needless anxiety to
              any person.
            </p>
            <p>
              27. Activities that are in breach of any other third party's rights, including downloading,
              installation, or distribution of pirated software or other inappropriately licensed software,
              deletion of any author attributions, legal notices, or proprietary designations or labels in any
              file that is uploaded, falsification of the origin or source of any software or other material.
            </p>
            <p>
              28. Anything that may disrupt or interfere with the network or services or cause a host or the
              network to crash.
            </p>
            <p>
              29. Launching "denial of service" attacks "mailbombing" attacks or "flooding" attacks against a
              host or network.
            </p>
            <p>
              30. Granting access to your Broadband Service to others not authorized by you.
            </p>
            <p>
              31. Circumventing the user authentication or security process of a host or network.
            </p>
            <p>
              32. Creating, transmitting, storing, or publishing any virus, Trojan, corrupting program or corrupted
              data.
            </p>
            <p>
              33. Monitoring or recording the actions of any person entitled to be in your home or business
              premises without their knowledge or any person or thing outside of your home or premises
              including, without limitation, any public highway or roadway or another person's home or
              business premises.
            </p>
            <p>
              34. Collecting, streaming, distributing, or accessing any material that you know, or reasonably
              should know, cannot be legally collected, streamed, distributed, or accessed.
              Security: you are responsible for ensuring that your usernames, passwords and login details for any broadband
              service or equipment remain confidential so that the network cannot be used by any
              unauthorized person including, but not limited to, those controlling access to (a) any computer
              hardware systems or networks; (b) any computer software or applications; or (c) any other
              services accessed by you in the use of either sample of the above. You shall not disclose these
              credentials to any third party or use the same for any purpose connected with the improper
              use of the network including accessing or attempting to access other parts of the services for
              which you do not have access rights.
            </p>
            <p>
              35. Broadband equipment will only be provided by the provider any Wi-Fi extenders will not be
              provided.
            </p>
            <p>
              36. You are responsible for taking all reasonable steps necessary to prevent a third party from
              obtaining access to the network. You must immediately advise us if you become aware of any
              violation or suspected violation of these security provisions. Other users; you are responsible for all uses made of the Broadband Service through your account (whether authorized or
              unauthorized) and for any breach of this policy whether an unacceptable use occurs or is
              attempted, whether you knew or should have known about it, whether or not you carried out
              or attempted the unacceptable use alone, contributed to or acted with others or allowed any
              unacceptable use to occur by omission.
            </p>
            <p>
              37. You agree that the all-inclusive company/landlord is not responsible for any of your activities in
              using the network. Although the internet is designed to appeal to a broad audience, it's your
              responsibility to determine whether any of the content accessed via the Broadband Service is
              appropriate for children or others in your household to view or use.
            </p>

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
            Details of the Utility agreement between company and tenant
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

      {/* Tenant Signatures Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tenant Signatures
          </CardTitle>
          <CardDescription>
            All tenants who have signed this utility agreement
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

      {/* Admin Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Admin Signature
          </CardTitle>
          <CardDescription>
            Signature from the admin to confirm agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.admin_sign ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Signed by {formData.admin_name || 'Admin'}
                </span>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={toAbsoluteUrl(formData.admin_sign)}
                  alt={`Admin signature - ${formData.admin_name || 'Admin'}`}
                  className="max-h-24 mx-auto"
                />
              </div>
              {formData.admin_sign_date && (
                <p className="text-xs text-muted-foreground text-center">
                  Signed on {formatDate(formData.admin_sign_date)}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                (Admin has signed this agreement)
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Not signed by admin yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Agreement Progress
          </CardTitle>
          <CardDescription>
            Current status of the agreement completion process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Agent/Landlord Details Filled</span>
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

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Admin Signature</span>
              <Badge variant={formData.admin_sign ? "default" : "secondary"}>
                {formData.admin_sign ? "Completed" : "Pending"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Agreement Status</span>
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