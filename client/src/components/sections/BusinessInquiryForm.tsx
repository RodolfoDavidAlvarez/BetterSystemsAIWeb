import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  // Step 1: Basic Information
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  
  // Step 2: Business Details
  industry: z.string().min(1, "Please select an industry"),
  currentChallenges: z.string().min(10, "Please describe your challenges"),
  whyInterested: z.string().min(10, "Please tell us why you're interested in AI solutions"),
  
  // Step 3: Project Specifics
  interestedServices: z.string().min(1, "Please select a service"),
  timeline: z.string().min(1, "Please select a timeline"),
  communicationPreference: z.string().min(1, "Please select your preferred communication method"),
  additionalInfo: z.string().optional(),
});

const steps = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Tell us about you and your company',
  },
  {
    id: 'details',
    title: 'Business Details',
    description: 'Help us understand your business better',
  },
  {
    id: 'specifics',
    title: 'Project Specifics',
    description: 'Details about your project requirements',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

export default function BusinessInquiryForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      industry: "",
      currentChallenges: "",
      whyInterested: "",
      interestedServices: "",
      timeline: "",
      additionalInfo: "",
      communicationPreference: "",
    },
  });

  const nextStep = () => {
    const fields = getFieldsForStep(step);
    const isValid = fields.every(field => {
      const value = form.getValues(field as any);
      return value && value.length > 0;
    });

    if (!isValid) {
      fields.forEach(field => {
        form.trigger(field as any);
      });
      return;
    }

    setDirection(1);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const getFieldsForStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return ['name', 'email', 'company'];
      case 1:
        return ['industry', 'currentChallenges', 'whyInterested'];
      case 2:
        return ['interestedServices', 'timeline', 'communicationPreference', 'additionalInfo'];
      default:
        return [];
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Starting form submission with values:', values);
    
    // Verify all required fields are present
    const requiredFields = [
      'name', 'email', 'company', 'industry', 'currentChallenges',
      'whyInterested', 'interestedServices', 'timeline', 'communicationPreference'
    ];
    
    const missingFields = requiredFields.filter(field => !values[field as keyof typeof values]);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Setting submission state to true');

    try {
      console.log('Attempting to submit form to webhook');
      const response = await fetch('https://hook.us1.make.com/y1oalov070odcaa6srerwwsfjcvn1r6n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          ...values,
          submissionDate: new Date().toISOString(),
          source: window.location.href,
        }),
      });

      console.log('Received response:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => {
          console.error('Failed to parse error response');
          return null;
        });
        console.error('Response error data:', errorData);
        throw new Error(
          errorData?.message || 
          `Submission failed with status ${response.status}: ${response.statusText}`
        );
      }

      console.log('Form submitted successfully');
      toast({
        title: "Submission Successful! 🎉",
        description: "Thank you for your inquiry. Our team will review your information and contact you within 24-48 hours through your preferred communication method.",
        duration: 6000,
      });

      // Reset form and state
      form.reset();
      setStep(0);
      console.log('Form reset completed');
    } catch (error) {
      console.error('Form submission error:', error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
          console.error('Network error details:', error);
        } else if (error.message.includes('CORS')) {
          errorMessage = "Cross-origin request blocked. Please try again later.";
          console.error('CORS error details:', error);
        } else {
          errorMessage = error.message;
          console.error('General error details:', error);
        }
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      console.log('Form submission process completed');
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-medium">Step {step + 1} of {steps.length}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">{steps[step].title}</span>
            </div>
            <span className="text-sm text-muted-foreground">{steps[step].description}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whyInterested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why are you interested in AI solutions?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Example: We're experiencing inefficiencies in our customer service department and need AI automation to handle routine inquiries, allowing our team to focus on complex cases"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentChallenges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Challenges</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the challenges you're facing..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="interestedServices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interested Services</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ai-assistants">AI Assistants</SelectItem>
                            <SelectItem value="efficiency-audit">Efficiency Audit</SelectItem>
                            <SelectItem value="fleet-management">Fleet Management</SelectItem>
                            <SelectItem value="custom-solutions">Custom Solutions</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeline</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate (1-2 months)</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="half">Next 6 Months</SelectItem>
                            <SelectItem value="year">Within a Year</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="communicationPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Communication Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select communication preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video-call">15-minute virtual video call</SelectItem>
                            <SelectItem value="phone-call">15-minute phone call</SelectItem>
                            <SelectItem value="email">Email conversation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                            placeholder="Any additional details you'd like to share..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 0}
            >
              Previous
            </Button>
            {step === steps.length - 1 ? (
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⚪</span>
                    Submitting...
                  </>
                ) : (
                  "Submit Inquiry"
                )}
              </Button>
            ) : (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
