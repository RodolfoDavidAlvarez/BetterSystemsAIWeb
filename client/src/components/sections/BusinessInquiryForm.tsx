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
  phone: z.string().min(10, "Please enter a valid phone number").max(20, "Phone number too long"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  currentChallenges: z.string(),
  whyInterested: z.string().optional(),
  timeline: z.string().min(1, "Please select a timeline"),
  communicationPreference: z.string().min(1, "Please select your preferred communication method"),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormStep {
  title: string;
  description: string;
}

export default function RequestSolutionForm() {
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      industry: "",
      currentChallenges: "",
      whyInterested: "",
      timeline: "",
      additionalInfo: "",
      communicationPreference: "",
    },
  });

  const steps: FormStep[] = [
    {
      title: "Basic Information",
      description: "Let's start with your basic information"
    },
    {
      title: "Business Details",
      description: "Help us understand your business better"
    },
    {
      title: "Project Specifics",
      description: "Details about your solution requirements"
    },
  ];

  const getFieldsForStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return ['name', 'email', 'phone', 'company'];
      case 1:
        return ['industry', 'currentChallenges', 'whyInterested'];
      case 2:
        return ['timeline', 'communicationPreference', 'additionalInfo'];
      default:
        return [];
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const values = form.getValues();
    console.log('Form values:', values);

    if (!form.formState.isValid) {
      console.log('Form validation failed');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          formIdentifier: "Request Solution Form"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(step);
    const results = await Promise.all(
      fields.map(field => form.trigger(field as any))
    );
    if (results.every(Boolean)) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
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
          <h2 className="text-3xl font-bold text-gray-900">Thank You for Your Request!</h2>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            We've successfully received your solution request. Our team will review your information and get back to you within 1-2 business days through your preferred communication method.
          </p>
        </div>
        <div className="pt-8">
          <Button
            onClick={() => {
              setIsSuccess(false);
              form.reset();
              setStep(0);
            }}
            variant="outline"
            className="mx-auto block min-w-[200px]"
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
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
                    <FormLabel>What solution are you looking to implement?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about the solution you're looking for..."
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
                disabled={isSubmitting || !form.formState.isValid}
                className="min-w-[120px] relative"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit Request"
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