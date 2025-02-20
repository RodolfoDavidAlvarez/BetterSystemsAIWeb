import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";

interface FormStep {
  title: string;
  description: string;
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export default function SimpleEfficiencyAssessmentForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      currentChallenges: "",
      desiredOutcome: "",
      timeline: "",
      additionalInfo: ""
    }
  });

  // Simplified steps
  const steps: FormStep[] = [
    {
      title: "Tell us about you",
      description: "Basic contact information to get started"
    },
    {
      title: "Your Business Needs",
      description: "Help us understand how we can help you"
    }
  ];

  useEffect(() => {
    scrollToTop();
  }, [currentStep]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("https://hook.us1.make.com/onwbnec5advmcbxw242fb1u9cqd0frd2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          formType: "Simple Efficiency Assessment"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      toast({
        title: "Thanks for reaching out!",
        description: "We'll get back to you shortly to discuss how we can help improve your business efficiency.",
      });

      form.reset();
      window.location.href = "/services/ai-efficiency-assessment";
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormDescription>
                    The name of your company or organization
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Enter your business name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormDescription>
                    How should we address you?
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormDescription>
                      Where we can reach you
                    </FormDescription>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormDescription>
                      Optional contact number
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="currentChallenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What challenges would you like help with?</FormLabel>
                  <FormDescription>
                    Tell us about any inefficiencies or bottlenecks in your business
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="For example: Manual data entry takes too much time, Having trouble keeping track of inventory, Need to automate customer communications..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desiredOutcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's your ideal outcome?</FormLabel>
                  <FormDescription>
                    How would you like your business to improve?
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="For example: Save 10 hours per week on administrative tasks, Reduce errors in order processing, Better customer response times..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Timeline</FormLabel>
                  <FormDescription>
                    When would you like to see these improvements?
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="e.g., Next month, Within 3 months, By end of year" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anything else we should know?</FormLabel>
                  <FormDescription>
                    Optional additional context that might help us understand your needs
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Share any other information you think would be helpful..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border border-primary/10 bg-background/50 shadow-sm">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">{steps[currentStep].title}</h2>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="w-full bg-primary/10 rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-2">{steps[currentStep].description}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <motion.div
                key={currentStep}
                initial="initial"
                animate="animate"
                variants={fadeIn}
              >
                {renderStep()}
              </motion.div>

              <div className="flex justify-between mt-8 pt-4 border-t border-primary/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
                  >
                    Next
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}