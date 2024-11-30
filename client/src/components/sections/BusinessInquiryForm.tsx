import { useState } from "react";
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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  currentChallenges: z.string().min(10, "Please describe your challenges"),
  whyInterested: z.string().min(10, "Please tell us why you're interested in AI solutions"),
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

export default function BusinessInquiryForm() {
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const nextStep = () => {
    console.log('Validating fields for step:', step);
    const fields = getFieldsForStep(step);
    const isValid = fields.every(field => {
      const value = form.getValues(field as any);
      return value && value.length > 0;
    });

    if (!isValid) {
      console.log('Field validation failed');
      fields.forEach(field => {
        form.trigger(field as any);
      });
      return;
    }

    console.log('Moving to next step');
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => {
    console.log('Moving to previous step');
    setStep((s) => Math.max(s - 1, 0));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form submission initiated at:', new Date().toISOString());
    console.log('Form values:', JSON.stringify(values, null, 2));
    
    // Log form validation start
    console.log('Starting form validation');
    const result = formSchema.safeParse(values);
    if (!result.success) {
      console.error('Validation failed:', result.error.issues);
      const errors = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
      
      // Log validation errors for debugging
      console.log('Validation errors:', errors);
      
      // Show toast with detailed error message
      toast({
        title: "Please Fix the Following Errors",
        description: errors.join('\n'),
        variant: "destructive",
        duration: 7000,
      });
      
      // Trigger validation on all fields to show errors
      Object.keys(values).forEach(field => {
        form.trigger(field as keyof typeof values);
      });
      
      return;
    }
    
    console.log('All fields validated successfully');

    console.log('Validation passed, proceeding with submission');
    setIsSubmitting(true);

    try {
      // Prepare form data with additional metadata
      const formData = {
        ...values,
        submissionDate: new Date().toISOString(),
        source: window.location.href,
        userAgent: navigator.userAgent,
        formVersion: '1.0',
        submissionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      console.log('Preparing to submit form data:', { formData });

      // Attempt to submit the form
      const response = await fetch('https://hook.us1.make.com/y1oalov070odcaa6srerwwsfjcvn1r6n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Submission-ID': formData.submissionId,
        },
        body: JSON.stringify(formData),
      });

      console.log('Received response:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Handle different response statuses
      if (!response.ok) {
        let errorMessage = 'Failed to submit the form';
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData.details || null;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Submission failed: ${response.statusText}`;
        }

        throw new Error(errorMessage, { cause: errorDetails });
      }

      const responseData = await response.json();
      console.log('Submission successful:', responseData);

      // Success handling
      toast({
        title: "Submission Successful! 🎉",
        description: "Thank you for your inquiry. Our team will contact you shortly.",
        duration: 5000,
      });

      // Reset form and state
      form.reset();
      setStep(0);
    } catch (error) {
      console.error('Form submission error:', {
        error,
        type: error instanceof Error ? 'Error' : typeof error,
        cause: error instanceof Error ? error.cause : undefined
      });
      
      // Detailed error handling
      let errorMessage = "An unexpected error occurred while submitting the form.";
      let errorDetail = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.cause) {
          errorDetail = typeof error.cause === 'string' 
            ? error.cause 
            : JSON.stringify(error.cause);
        }
      } else if (error instanceof TypeError) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast({
        title: "Submission Failed",
        description: errorDetail ? `${errorMessage}\n${errorDetail}` : errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsSubmitting(false);
      console.log('Form submission completed');
    }
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Step {step + 1} of {steps.length}</span>
          <span className="text-sm text-muted-foreground">{steps[step].description}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && (
            <>
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
            </>
          )}

          {step === 1 && (
            <>
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
              <FormField
                control={form.control}
                name="whyInterested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why are you interested in AI solutions?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us why you're looking into AI solutions..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {step === 2 && (
            <>
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
                    <FormLabel>Additional Information (Optional)</FormLabel>
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
            </>
          )}

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
                className="min-w-[120px] relative"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div 
                        className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" 
                        role="status" 
                        aria-label="Submitting form" 
                      />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Inquiry</span>
                  )}
                </div>
                {isSubmitting && (
                  <div className="absolute inset-0 bg-primary/10 rounded-md" />
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
