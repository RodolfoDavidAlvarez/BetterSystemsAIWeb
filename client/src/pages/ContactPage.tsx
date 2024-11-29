import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import BusinessInquiryForm from "@/components/sections/BusinessInquiryForm";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground">
            Ready to transform your business with AI? Get in touch with us today.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Schedule a Consultation</h2>
              <p className="text-muted-foreground mb-6">
                Book a free consultation with our experts to discuss your business needs.
              </p>
              <Button asChild className="w-full">
                <Link href="/booking">Book Consultation</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Connect on Social</h2>
              <p className="text-muted-foreground mb-6">
                Follow us on social media for the latest updates and insights.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/social">Social Links</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Business Inquiry Form</h2>
            <BusinessInquiryForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
