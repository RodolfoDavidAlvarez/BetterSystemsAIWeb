import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { Mail, MessageSquare, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  question: z.string().min(10, "Question must be at least 10 characters"),
});

export default function ContactPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      question: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log('Question submitted:', values);
      toast({
        title: "Question Sent!",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send question. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground">
            Ready to transform your business with AI? Get in touch with us today.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-0">
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

        <Card className="shadow-sm border-0 mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Ask Us a Question</h2>
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
                        Your Question
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
                  Send Question
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}