import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { Mail, Phone, UserPlus, CheckCircle, ChevronDown, ChevronUp, MapPin, Globe } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // At least one contact method (email or phone) is required
  const hasEmail = data.email && data.email.trim().length > 0;
  const hasPhone = data.phone && data.phone.trim().length > 0;
  return hasEmail || hasPhone;
}, {
  message: "Please provide either an email or phone number",
  path: ["email"],
}).refine((data) => {
  // If email is provided, it must be valid
  if (data.email && data.email.trim().length > 0) {
    return z.string().email().safeParse(data.email).success;
  }
  return true;
}, {
  message: "Invalid email address",
  path: ["email"],
});

type FormValues = z.infer<typeof formSchema>;

const SocialPage: React.FC = () => {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    },
  });

  const handleDownloadContact = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Rodolfo Alvarez
N:Alvarez;Rodolfo;;;
ORG:Better Systems AI
TEL;TYPE=CELL:+19285501649
EMAIL:ralvarez@bettersystems.ai
END:VCARD`;

    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rodolfo_alvarez.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formIdentifier: "Contact Card Form",
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          company: values.company || undefined,
          notes: values.notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSuccess(true);
      setIsFormOpen(false);
      toast({
        title: "Thank you!",
        description: "We've received your information. Check your email for confirmation.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Rodolfo Alvarez - Better Systems AI | Contact Card"
        description="Connect with Rodolfo Alvarez, CEO & Founder of Better Systems AI. Get in touch via email, phone, or schedule a meeting."
        path="/rodolfo"
      />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardContent className="space-y-6 p-8">
            {/* Logo */}
            <div className="flex justify-center pb-2">
              <img 
                src="/official-logo.png" 
                alt="Better Systems AI Logo" 
                className="h-14 w-auto object-contain" 
              />
            </div>

            {/* Profile Section */}
            <div className="text-center space-y-4">
              <Avatar className="h-32 w-32 mx-auto ring-4 ring-primary/10">
                <AvatarImage 
                  src="/Professional Headshot Rodolfo compressed.jpg" 
                  alt="Rodolfo Alvarez"
                  className="object-cover object-top"
                />
                <AvatarFallback>RA</AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-2xl font-bold mb-1">Rodolfo Alvarez</h1>
                <p className="text-base font-semibold text-primary mb-2">CEO & Founder</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Better Systems AI
                </p>
              </div>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Phoenix, Arizona</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Serving clients worldwide</span>
                </div>
              </div>
            </div>

            {/* Save Contact Button */}
            <div className="pt-2">
              <Button
                onClick={handleDownloadContact}
                variant="outline"
                className="w-full border-primary/20 hover:bg-primary/5"
                size="sm"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Save Contact
              </Button>
            </div>

            {/* Collapsible Contact Form Section */}
            {!isSuccess ? (
              <div className="pt-2 border-t">
                <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="default" 
                      className="w-full justify-between bg-primary hover:bg-primary/90"
                      type="button"
                    >
                      <span>Share contact information with Rodolfo</span>
                      {isFormOpen ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Name *</label>
                        <Input
                          placeholder="Your name"
                          {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email</label>
                        <Input
                          placeholder="your@email.com"
                          type="email"
                          {...form.register("email")}
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Phone</label>
                        <Input
                          placeholder="(555) 123-4567"
                          type="tel"
                          {...form.register("phone")}
                        />
                        {form.formState.errors.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Company</label>
                        <Input
                          placeholder="Your company name"
                          {...form.register("company")}
                        />
                        {form.formState.errors.company && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.company.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Notes</label>
                        <Textarea
                          placeholder="Any additional information..."
                          {...form.register("notes")}
                          className="min-h-[80px]"
                        />
                        {form.formState.errors.notes && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.notes.message}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        * Name and at least one contact method required
                      </p>

                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    </form>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <div className="text-center space-y-4 pt-2 border-t">
                <div className="inline-block p-4 rounded-full bg-primary/10">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Thank You!</h2>
                  <p className="text-sm text-muted-foreground">
                    We've received your contact information. Check your email for a welcome message!
                  </p>
                </div>
              </div>
            )}

            {/* Contact Buttons with Numbers */}
            <div className="space-y-2 pt-2 border-t">
              <a
                href="mailto:ralvarez@bettersystems.ai"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Email</span>
                  <span className="text-xs text-muted-foreground">ralvarez@bettersystems.ai</span>
                </div>
              </a>
              
              <a
                href="tel:+19285501649"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Call</span>
                  <span className="text-xs text-muted-foreground">(928) 550-1649</span>
                </div>
              </a>
            </div>

            {/* Footer Link */}
            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Visit our website →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SocialPage;