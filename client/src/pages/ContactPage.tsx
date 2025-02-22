import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, User, Phone } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  question: z.string().min(10, "Question must be at least 10 characters"),
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
      question: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch('https://hook.us1.make.com/y1oalov070odcaa6srerwwsfjcvn1r6n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_name: "Contact us",
          name: values.name,
          email: values.email,
          message: values.question,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSuccess(true);
      toast({
        title: "Thank you for contacting us!",
        description: "We'll get back to you as soon as possible. Redirecting to home page...",
      });
      form.reset();

      // Simple timeout for redirect
      setTimeout(() => {
        setLocation('/');
      }, 2000);
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            We've received your message and will get back to you shortly.
            Redirecting to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground">
            Ready to transform your business with AI? Get in touch with us today.
          </p>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.location.href = 'tel:9285501649'}
          >
            <Phone className="h-4 w-4" />
            Call Us: (928) 550-1649
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.location.href = 'mailto:ralvarez@bettersystems.ai'}
          >
            <Mail className="h-4 w-4" />
            Email Us: ralvarez@bettersystems.ai
          </Button>
        </div>

        {/* Contact Form */}
        <Card className="shadow-sm border-0 mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Your Message
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What would you like to know?"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Social Links Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-0">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Connect on Social</h2>
            <p className="text-muted-foreground mb-6">
              Follow us on social media for the latest updates and insights.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/founders-social">Social Links</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}