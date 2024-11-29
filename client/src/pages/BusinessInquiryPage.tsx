import BusinessInquiryForm from "@/components/sections/BusinessInquiryForm";
import { Card, CardContent } from "@/components/ui/card";

export default function BusinessInquiryPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Tell us more about you</h1>
          <p className="text-muted-foreground">
            Tell us about your business needs and how we can help transform your operations with AI.
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <BusinessInquiryForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
