import { useState } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Minus } from "lucide-react";

const TECHNOLOGY_FIELDS = [
  { key: "payment", label: "Payment (POS)", placeholder: "Square, Clover, Stripe" },
  { key: "accounting", label: "Accounting", placeholder: "Quickbooks, Sage" },
  { key: "communications", label: "Communications", placeholder: "Pipedrive, Zoho, Salesforce" },
  { key: "administration", label: "Administration", placeholder: "Google sheets, Drive, SQL" },
  { key: "coordination", label: "Coordination", placeholder: "Asana, Trello, Monday" },
  { key: "booking", label: "Booking System", placeholder: "Calendly, Booksy, Acuity" },
  { key: "website", label: "Website Capabilities", placeholder: "Basic website (e.g., Wix or Squarespace) or advanced website with features like automations, booking systems, or custom integrations" },
] as const;

type TechnologyKey = typeof TECHNOLOGY_FIELDS[number]["key"];

const technologyFieldSchema = z.object({
  value: z.string().optional(),
  none: z.boolean().default(false),
});

const formSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  services: z.array(z.object({
    name: z.string().min(1, "Service name is required"),
    description: z.string().optional(),
  })),
  totalEmployees: z.string().min(1, "Number of employees is required"),
  totalLocations: z.string().min(1, "Number of locations is required"),
  technology: z.record(z.enum([
    "payment",
    "accounting",
    "communications",
    "administration",
    "coordination",
    "booking",
    "website"
  ]), technologyFieldSchema),
  workflows: z.array(z.object({
    description: z.string().min(1, "Workflow description is required"),
  })),
  challenges: z.array(z.object({
    description: z.string().min(1, "Challenge description is required"),
  })),
  integrationNeeds: z.array(z.object({
    description: z.string().min(1, "Integration need description is required"),
  })),
  growthGoals: z.string().optional(),
}).refine((data) => data.phone || data.email, {
  message: "Either phone number or email is required",
  path: ["email"],
});

type FormValues = z.infer<typeof formSchema>;

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

const scrollToField = (fieldName: string) => {
  setTimeout(() => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element && element instanceof HTMLElement) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      element.focus();
    }
  }, 100);
};

export default function PreAssessmentQuestionnairePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      contactName: "",
      phone: "",
      email: "",
      services: [],
      totalEmployees: "",
      totalLocations: "",
      technology: TECHNOLOGY_FIELDS.reduce((acc, { key }) => ({
        ...acc,
        [key]: { value: "", none: false }
      }), {} as Record<TechnologyKey, { value: string; none: boolean }>),
      workflows: [],
      challenges: [],
      integrationNeeds: [],
      growthGoals: ""
    },
    mode: "onBlur",
    shouldFocusError: false,
    criteriaMode: "firstError",
    reValidateMode: "onBlur"
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services"
  });

  const { fields: workflowFields, append: appendWorkflow, remove: removeWorkflow } = useFieldArray({
    control: form.control,
    name: "workflows"
  });

  const { fields: challengeFields, append: appendChallenge, remove: removeChallenge } = useFieldArray({
    control: form.control,
    name: "challenges"
  });

  const { fields: integrationFields, append: appendIntegration, remove: removeIntegration } = useFieldArray({
    control: form.control,
    name: "integrationNeeds"
  });

  const steps: FormStep[] = [
    {
      title: "General Information",
      description: "Let's start with your basic business information"
    },
    {
      title: "Services & Products",
      description: "Tell us about what you offer"
    },
    {
      title: "Scale & Technology",
      description: "Help us understand your business scale and current technology stack"
    },
    {
      title: "Pain Points & Vision",
      description: "Share your challenges and goals"
    }
  ];

  const renderFormField = (fieldName: string, label: string, placeholder: string) => (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field, fieldState }) => (
        <FormItemWithError error={!!fieldState.error}>
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                placeholder={placeholder}
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormItemWithError>
      )}
    />
  );

  const renderTextareaField = (fieldName: string, label: string | null, placeholder: string) => (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field, fieldState }) => (
        <FormItemWithError error={!!fieldState.error}>
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Textarea
                placeholder={placeholder}
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormItemWithError>
      )}
    />
  );

  const renderTechnologyField = (key: TechnologyKey, label: string, placeholder: string) => {
    const isNoneChecked = form.getValues(`technology.${key}.none`);

    return (
      <div key={key} className="space-y-2">
        <FormField
          control={form.control}
          name={`technology.${key}.value` as any}
          render={({ field, fieldState }) => (
            <FormItemWithError error={!!fieldState.error}>
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <div className="flex gap-4 items-center">
                  <FormControl>
                    <Input
                      placeholder={placeholder}
                      disabled={isNoneChecked}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue(`technology.${key}.none`, false);
                      }}
                    />
                  </FormControl>
                  <FormField
                    control={form.control}
                    name={`technology.${key}.none` as any}
                    render={({ field: checkboxField }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={checkboxField.value}
                            onCheckedChange={(checked) => {
                              checkboxField.onChange(checked);
                              if (checked) {
                                form.setValue(`technology.${key}.value`, '');
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">None</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            </FormItemWithError>
          )}
        />
      </div>
    );
  };

  const findFirstErrorField = () => {
    const errors = form.formState.errors;
    let firstErrorStep = -1;
    let firstErrorField = '';

    for (let i = 0; i < steps.length; i++) {
      const fields = getFieldsForStep(i);
      for (const field of fields) {
        const fieldParts = field.split('.');
        let current: any = errors;
        for (const part of fieldParts) {
          current = current?.[part];
          if (!current) break;
        }
        if (current) {
          firstErrorStep = i;
          firstErrorField = field;
          break;
        }
      }
      if (firstErrorStep !== -1) break;
    }

    return { step: firstErrorStep, field: firstErrorField };
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    const { step: firstErrorStep, field: firstErrorField } = findFirstErrorField();

    if (firstErrorStep !== -1) {
      setCurrentStep(firstErrorStep);
      toast({
        title: "Please check your inputs",
        description: "Some required fields need your attention",
        variant: "destructive",
      });

      setTimeout(() => scrollToField(firstErrorField), 100);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("https://hook.us1.make.com/onwbnec5advmcbxw242fb1u9cqd0frd2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      toast({
        title: "Success!",
        description: "Thank you for completing the pre-assessment questionnaire. We'll be in touch soon!",
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

  const FormItemWithError = ({ children, error }: { children: React.ReactNode; error?: boolean }) => (
    <div data-error={error} className="relative">
      {children}
    </div>
  );


  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {renderFormField("businessName", "Legal Business Name", "Enter your company's legal business name")}
            {renderFormField("contactName", "Contact Name *", "Enter the primary contact person's name")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFormField("phone", "Contact Phone Number", "Enter contact phone number")}
              {renderFormField("email", "Contact Email Address", "Enter contact email address")}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Products and Services</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendService({ name: "", description: "" })}
                  disabled={serviceFields.length >= 15}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service/Product
                </Button>
              </div>
              {serviceFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border border-gray-800 rounded-lg bg-background/30">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Service/Product {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderFormField(`services.${index}.name`, "Name", "Enter service or product name")}
                  {renderTextareaField(`services.${index}.description`, "Description", "Provide a detailed description of this service or product")}
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFormField("totalEmployees", "Total Number of Employees", "Enter total number of employees")}
              {renderFormField("totalLocations", "Total Number of Locations", "Enter total number of locations")}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technology Used</h3>
              <p className="text-sm text-muted-foreground">Select the tools and technologies used in each department. Check "None" if a particular technology is not used.</p>
              {TECHNOLOGY_FIELDS.map(({ key, label, placeholder }) => (
                renderTechnologyField(key, label, placeholder)
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>What are workflows in your business that you feel can be automated or optimized?</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendWorkflow({ description: "" })}
                  disabled={workflowFields.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workflow
                </Button>
              </div>
              {workflowFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border border-gray-800 rounded-lg bg-background/30">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Workflow {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkflow(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderTextareaField(`workflows.${index}.description`, null, "Describe a workflow or process that could be automated")}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Any other business challenges we can help with?</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendChallenge({ description: "" })}
                  disabled={challengeFields.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Challenge
                </Button>
              </div>
              {challengeFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border border-gray-800 rounded-lg bg-background/30">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Challenge {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChallenge(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderTextareaField(`challenges.${index}.description`, null, "Describe a business challenge you're facing")}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Do you need help integrating any systems?</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendIntegration({ description: "" })}
                  disabled={integrationFields.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
              {integrationFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border border-gray-800 rounded-lg bg-background/30">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Integration {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIntegration(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderTextareaField(`integrationNeeds.${index}.description`, null, "Describe which systems need integration")}
                </div>
              ))}
            </div>
            {renderTextareaField("growthGoals", "What are your top goals for growth or improvement?", "Examples: Increase sales, launch new products, automate processes, improve customer service, expand to new markets")}
          </div>
        );
      default:
        return null;
    }
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return ["businessName", "contactName", "phone", "email"];
      case 1:
        return serviceFields.map(field => `services.${field.id}.name`);
      case 2:
        return ["totalEmployees", "totalLocations", ...Object.keys(form.getValues("technology")).map(key => `technology.${key}.value`)];
      case 3:
        return [...workflowFields.map(field => `workflows.${field.id}.description`),
          ...challengeFields.map(field => `challenges.${field.id}.description`),
          ...integrationFields.map(field => `integrationNeeds.${field.id}.description`),
          "growthGoals"];
      default:
        return [];
    }
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields as Array<keyof FormValues>);

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      scrollToTop();
    } else {
      const firstErrorField = fields.find(field =>
        form.getFieldState(field as keyof FormValues)?.error
      );
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    scrollToTop();
  };

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <motion.div
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link to="/services/efficiency-audit" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Efficiency Audit
        </Link>
        <h1 className="text-4xl font-bold mb-4">Pre-Assessment Questionnaire</h1>
        <p className="text-lg text-muted-foreground">
          Help us understand your business better so we can identify opportunities
          for improvement and automation.
        </p>
      </motion.div>

      <motion.div
        className="max-w-3xl mx-auto form-container"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
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
                {renderStep()}
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>

                  {currentStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[120px] relative"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}