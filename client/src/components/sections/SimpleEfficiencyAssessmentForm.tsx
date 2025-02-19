import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";

interface FormStep {
  title: string;
  description: string;
}

const scrollToTop = () => {
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
      technology: "",
      desiredOutcome: "",
      timeline: "",
      budget: "",
      additionalInfo: ""
    }
  });

  const steps: FormStep[] = [
    {
      title: "Basic Information",
      description: "Tell us about your business"
    },
    {
      title: "Current Situation",
      description: "Help us understand your needs"
    },
    {
      title: "Goals & Timeline",
      description: "Share your vision with us"
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
        title: "Success!",
        description: "Thank you for completing the assessment. We'll be in touch soon!",
      });

      form.reset();
      window.location.href = "/services/efficiency-audit";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit the form. Please try again.",
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
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                    <FormControl>
                      <Input placeholder="your@email.com" type="email" {...field} />
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
                  <FormLabel>What challenges is your business facing?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any operational inefficiencies, bottlenecks, or areas where you'd like to improve"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="technology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What technology or tools do you currently use?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any software, tools, or systems you're currently using"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="desiredOutcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What improvements would you like to see?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your ideal outcome after implementing efficiency improvements"
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
                  <FormLabel>When would you like to implement these changes?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Within 3 months, Next quarter, etc." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have a budget range in mind?</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional: Your expected budget range" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anything else you'd like to share?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information that might help us understand your needs better"
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
    <div className="max-w-3xl mx-auto form-container">
      <Card className="border border-gray-800 bg-background/50 shadow-sm">
        <CardContent className="p-8">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">{steps[currentStep].title}</h2>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
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

              <div className="flex justify-between mt-8 pt-4 border-t border-gray-800">
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
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      "Submit Assessment"
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
