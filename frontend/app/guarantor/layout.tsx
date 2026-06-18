import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function SharedGuarantorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Student Moves - Guarantor Form
                </h1>
              </div>
            </div>
          </header>
          <main className="py-8">
            {children}
          </main>
          <footer className="bg-white border-t mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
              <p>© 2024 Student Moves. All rights reserved.</p>
              <p className="mt-1">This is a secure form. Your information is protected.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}