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
  { key: "payment", label: "Payment (POS)" },
  { key: "accounting", label: "Accounting" },
  { key: "communications", label: "Communications" },
  { key: "administration", label: "Administration" },
  { key: "coordination", label: "Coordination" },
  { key: "booking", label: "Booking System" },
  { key: "website", label: "Website Capabilities" },
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

export default function PreAssessmentQuestionnairePage() {
  const [currentStep, setCurrentStep] = useState(0);
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
    }
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

  const handleNext = () => {
    const currentFields = Object.keys(form.formState.errors);
    if (currentFields.length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Please check your inputs",
        description: "Some fields require your attention",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const onSubmit = async (values: FormValues) => {
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
                  <FormLabel>Legal Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
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
                    <FormLabel>Contact Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <div key={field.id} className="space-y-4 p-4 border rounded-lg">
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

                  <FormField
                    control={form.control}
                    name={`services.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Service/Product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`services.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe this service or product"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalEmployees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Number of Employees</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalLocations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Number of Locations</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technology Stack</h3>

              {TECHNOLOGY_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <FormField
                    control={form.control}
                    name={`technology.${key}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <div className="flex gap-4 items-center">
                          <FormControl>
                            <Input
                              placeholder={`Enter ${label.toLowerCase()} tools`}
                              {...field}
                              disabled={form.watch(`technology.${key}.none`)}
                            />
                          </FormControl>
                          <FormField
                            control={form.control}
                            name={`technology.${key}.none`}
                            render={({ field: checkboxField }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={checkboxField.value}
                                    onCheckedChange={(checked) => {
                                      checkboxField.onChange(checked);
                                      if (checked) {
                                        form.setValue(`technology.${key}.value`, "");
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
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Workflows */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Workflows to Automate/Optimize</Label>
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
                <div key={field.id} className="space-y-4 p-4 border rounded-lg">
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

                  <FormField
                    control={form.control}
                    name={`workflows.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the workflow that needs automation"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Business Challenges */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Business Challenges</Label>
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
                <div key={field.id} className="space-y-4 p-4 border rounded-lg">
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

                  <FormField
                    control={form.control}
                    name={`challenges.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the business challenge"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Integration Needs */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>System Integration Needs</Label>
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
                <div key={field.id} className="space-y-4 p-4 border rounded-lg">
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

                  <FormField
                    control={form.control}
                    name={`integrationNeeds.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the integration need"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="growthGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top Goals for Growth or Improvement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="E.g., Increase sales, launch new products, automate processes"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
    <div className="container mx-auto px-4 py-16">
      <motion.div
        className="max-w-3xl mx-auto mb-12"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <Link href="/services/efficiency-audit" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Efficiency Audit
        </Link>
        <h1 className="text-4xl font-bold mb-4">Pre-Assessment Questionnaire</h1>
        <p className="text-lg text-muted-foreground">
          Help us understand your business better so we can identify opportunities
          for improvement and automation. This information will help us prepare a
          tailored solution for your needs.
        </p>
      </motion.div>

      <motion.div
        className="max-w-3xl mx-auto"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <Card className="border-[0.5px] border-opacity-40 bg-background/50 shadow-sm">
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">{steps[currentStep].title}</h2>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {renderStep()}

                <div className="flex justify-between mt-8 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>

                  {currentStep === steps.length - 1 ? (
                    <Button type="submit">
                      Submit Assessment
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleNext}>
                      Next Step
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