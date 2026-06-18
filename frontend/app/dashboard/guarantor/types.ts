export interface GuarantorFormData {
  guarantor_name: string;
  guarantor_dob: Date;
  guarantor_address: string;
  guarantor_postcode: string;
  guarantor_email: string;
  guarantor_phone: string;
  guarantor_nationality: string;
  profession: string;
  annual_income: string;
  relationship_tenant: string;
  witness_name: string;
  witness_address: string;
  witness_postcode: string;
  witness_phone: string;
  witness_email: string;
  guarantor_signature?: string;
  witness_signature?: string;
}

export interface GuarantorStepProps {
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onSubmit: (data: any) => Promise<void>;
  isSharedAccess?: boolean;
}
