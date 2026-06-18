import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left side - Branding and info */}
      <div className="hidden flex-col justify-between bg-primary p-6 text-gray-600 md:flex md:w-1/2 lg:p-12">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <a href="/" className="text-xl font-bold text-black">
              <img
                src="/smlogo.png"
                alt="Student Moves Logo"
                width={300}
                className="rounded-md bg-white p-1"
              />
            </a>
            {/* <span className="text-xl font-bold text-black">
              Student <span className="text-gray-600">Moves</span>{" "}
            </span> */}
          </div>

          {/* Hero content */}
          <div className="space-y-4 pt-8 md:max-w-md md:pt-20">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Find your perfect student accommodation
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Student Moves connects landlords with students looking for quality
              accommodation in the UK. Join our platform to simplify your
              property search or listing process.
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="space-y-4 rounded-lg bg-primary-foreground/10 p-6">
          <p className="italic text-primary-foreground">
            "Student Moves made finding my university accommodation so easy. I
            found a great place within a week of searching!"
          </p>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20"></div>
            <div>
              <p className="font-medium text-gray-600">Sarah Johnson</p>
              <p className="text-sm text-primary-foreground/80">
                University of Manchester
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full flex-1 md:w-1/2">
        <div className="flex h-full w-full flex-col overflow-y-auto">
          {/* Mobile header */}
          <div className="flex items-center space-x-2 border-b bg-background p-4 md:hidden">
            <a href="/" className="inline-block">
              <img
                src="/smlogo.png"
                alt="Student Moves Logo"
                width={200}
                className="rounded-md bg-white p-1"
              />
            </a>
            {/* <span className="text-lg font-bold">Student Moves</span> */}
          </div>
          <Toaster />

          {children}
        </div>
      </div>
    </div>
  );
}
