import MerchantRegisterForm from "./registerForm";

export default function MerchantSignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Merchant Registration</h2>
          <p className="text-muted-foreground">
            Create your merchant account to manage offers.
          </p>
        </div>
        <MerchantRegisterForm />
      </div>
    </div>
  );
}
