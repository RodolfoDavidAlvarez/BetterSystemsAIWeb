import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  question: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      question: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formIdentifier: "Contact Form",
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.question,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const result = await response.json();

      setIsSuccess(true);
      toast({
        title: "Thank you!",
        description: "We'll get back to you within 24 hours.",
      });
      form.reset();

      setTimeout(() => {
        setLocation('/');
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-6">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We've received your message and will get back to you within 24 hours.
          </p>
          <p className="text-sm text-muted-foreground mt-4">Check your email for confirmation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <SEO 
        title="Contact Us - Better Systems AI"
        description="Get in touch to discuss how AI automation can transform your business. Free consultation available."
      />
      
      
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us about your business challenges and we'll show you how AI can help.
          </p>
        </div>


        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <Input
                      placeholder="Your name"
                      {...form.register("name")}
                      className="mt-1"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      placeholder="your@email.com"
                      type="email"
                      {...form.register("email")}
                      className="mt-1"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <Input
                      placeholder="(555) 123-4567"
                      type="tel"
                      {...form.register("phone")}
                      className="mt-1"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <Textarea
                      placeholder="Tell us about your business challenges and how we can help..."
                      {...form.register("question")}
                      className="min-h-[120px] mt-1"
                    />
                    {form.formState.errors.question && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.question.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Message <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    We'll respond within 24 hours
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Get in touch</h3>
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Call us</h4>
                      <a href="tel:9285501649" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <Phone className="h-4 w-4" />
                        <span>(928) 550-1649</span>
                      </a>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Email</h4>
                      <a href="mailto:info@bettersystems.ai" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <Mail className="h-4 w-4" />
                        <span>info@bettersystems.ai</span>
                      </a>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 inline mr-1 text-primary" />
                        Free consultation available
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <CheckCircle className="h-4 w-4 inline mr-1 text-primary" />
                        24-hour response time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}