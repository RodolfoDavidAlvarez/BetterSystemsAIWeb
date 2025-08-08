import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface FormStep {
  title: string;
  description: string;
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export default function EfficiencyAssessmentForm() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      industry: "",
      employees: "",
      currentChallenges: "",
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
      title: "Business Details",
      description: "Help us understand your current situation"
    },
    {
      title: "Project Goals",
      description: "Share your vision and timeline"
    }
  ];

  useEffect(() => {
    scrollToTop();
  }, [step]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          formIdentifier: "Efficiency Assessment Form"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Parse the JSON response
      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        form.reset();
      } else {
        throw new Error(result.message || "Failed to submit form");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit the form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white p-12 rounded-lg shadow-sm space-y-8">
        <div className="rounded-full w-24 h-24 bg-green-100 mx-auto flex items-center justify-center">
          <svg 
            className="w-12 h-12 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Thank You!</h2>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            We've received your assessment request. Our team will review your information
            and get back to you within 1-2 business days.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsSuccess(false);
            form.reset();
            setStep(0);
          }}
          variant="outline"
          className="mx-auto block min-w-[200px]"
        >
          Submit Another Assessment
        </Button>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
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
        );
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Employees</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentChallenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Business Challenges</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What challenges is your business facing?"
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
                  <FormLabel>Desired Outcome</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What improvements would you like to see in your business?"
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
                  <FormLabel>Implementation Timeline</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="immediate">Within 1 month</SelectItem>
                      <SelectItem value="quarter">Next 3 months</SelectItem>
                      <SelectItem value="halfYear">Next 6 months</SelectItem>
                      <SelectItem value="year">Within a year</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="50k+">$50,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other details you'd like to share?"
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
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Step {step + 1} of {steps.length}</span>
          <span className="text-sm text-muted-foreground">{steps[step].description}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <motion.div
            key={step}
            initial="initial"
            animate="animate"
            variants={fadeIn}
          >
            {renderStep()}
          </motion.div>

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
            >
              Previous
            </Button>

            {step === steps.length - 1 ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit Assessment"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
