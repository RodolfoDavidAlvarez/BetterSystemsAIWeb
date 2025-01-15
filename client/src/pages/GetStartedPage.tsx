import BusinessInquiryForm from "@/components/sections/BusinessInquiryForm";

export default function GetStartedPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Get Started</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Fill out the form below to begin your AI transformation journey. Our team will review your information and get back to you shortly.
        </p>
      </div>
      <BusinessInquiryForm />
    </div>
  );
}
