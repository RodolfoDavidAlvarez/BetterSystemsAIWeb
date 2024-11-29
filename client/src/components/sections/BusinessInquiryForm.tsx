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
        return ['interestedServices', 'timeline', 'additionalInfo'];
      default:
        return [];
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would typically send the data to your backend
    toast({
      title: "Inquiry submitted!",
      description: "We'll get back to you as soon as possible.",
    });
    form.reset();
    setStep(0);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-full">
                  {i > 0 && (
                    <div className={`h-[2px] flex-1 ${step > i - 1 ? 'bg-primary' : 'bg-gray-300'}`} />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 relative z-10 bg-background
                    ${step >= i ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-[2px] flex-1 ${step > i ? 'bg-primary' : 'bg-gray-300'}`} />
                  )}
                </div>
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-max text-center">
                  <div className="font-medium whitespace-nowrap">{s.title}</div>
                  <div className="text-muted-foreground text-xs whitespace-nowrap">{s.description}</div>
                </div>
              </div>
            </div>
          ))}
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
              <Button type="submit">Submit Inquiry</Button>
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
