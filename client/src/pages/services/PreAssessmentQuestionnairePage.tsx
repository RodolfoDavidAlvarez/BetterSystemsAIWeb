import { useState } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  // Step 1
  legalBusinessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  businessSlogan: z.string().optional(),
  coreValues: z.array(z.string()).optional().default([]),
  missionStatement: z.string().min(10, "Mission statement should be at least 10 characters"),
  visionStatement: z.string().min(10, "Vision statement should be at least 10 characters"),

  // Step 2
  locations: z.string().min(1, "Please enter number of locations"),
  employeesPerLocation: z.string().min(1, "Please provide employee distribution"),
  productsServices: z.string().min(10, "Please describe your products/services"),
  operationalPainPoints: z.string().min(10, "Please describe your pain points"),
  technology: z.object({
    accounting: z.string().optional(),
    administration: z.string().optional(),
    operations: z.string().optional(),
    marketing: z.string().optional(),
  }),

  // Step 3
  manualTasks: z.string().min(10, "Please describe manual tasks"),
  efficiencyImprovements: z.string().min(10, "Please describe areas needing improvement"),

  // Step 4
  preferredContact: z.enum(["Email", "Phone", "Video Call"]),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormStep {
  title: string;
  description: string;
}

const CORE_VALUES = [
  "Integrity",
  "Innovation",
  "Customer Focus",
  "Excellence",
  "Teamwork",
  "Sustainability"
] as const;

export default function PreAssessmentQuestionnairePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legalBusinessName: "",
      email: "",
      phone: "",
      businessSlogan: "",
      coreValues: [],
      missionStatement: "",
      visionStatement: "",
      locations: "",
      employeesPerLocation: "",
      productsServices: "",
      operationalPainPoints: "",
      technology: {
        accounting: "",
        administration: "",
        operations: "",
        marketing: "",
      },
      manualTasks: "",
      efficiencyImprovements: "",
      preferredContact: "Email",
      additionalNotes: "",
    },
  });

  const steps: FormStep[] = [
    {
      title: "Preliminary Business Details",
      description: "Tell us about your company's foundation and identity"
    },
    {
      title: "Organizational Structure and Current Operations",
      description: "Help us understand your company structure and processes"
    },
    {
      title: "Automation & Bottlenecks",
      description: "Identify areas where we can improve efficiency"
    },
    {
      title: "Preferred Communication & Submission",
      description: "Let us know how to best reach you for the next steps"
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
      // Here you would send the form data to your backend
      console.log("Form submitted:", values);

      toast({
        title: "Success!",
        description: "Thank you! We'll be in touch soon to discuss your pre-assessment results.",
      });

      // Redirect to founders-social page after submission
      window.location.href = "/founders-social";
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
              name="legalBusinessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Innovations LLC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="info@abcinnovations.com" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessSlogan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Slogan or Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="Innovating the Future" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coreValues"
              render={() => (
                <FormItem>
                  <FormLabel>Core Values</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {CORE_VALUES.map((value) => (
                      <FormField
                        key={value}
                        control={form.control}
                        name="coreValues"
                        render={({ field }) => (
                          <FormItem
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (item) => item !== value
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {value}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="missionStatement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission Statement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Our mission is to leverage AI solutions..."
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
              name="visionStatement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vision Statement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="To be the global leader in AI-driven operational efficiency..."
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

      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="locations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Locations</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeesPerLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employees per Location</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Location 1: 10 employees&#10;Location 2: 8 employees&#10;Location 3: 5 employees"
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
              name="productsServices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Products/Services Offered</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product A: Accounting Platform&#10;Service B: HR Consulting"
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
              name="operationalPainPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biggest Operational Pain Points</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="1. Data entry takes too long&#10;2. Scheduling conflicts in team collaboration"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Departmental Technology Stacks & Tools</h3>

              <FormField
                control={form.control}
                name="technology.accounting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accounting</FormLabel>
                    <FormControl>
                      <Input placeholder="QuickBooks Online, Xero Cloud" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technology.administration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administration/Data Management</FormLabel>
                    <FormControl>
                      <Input placeholder="Google Sheets, SQL Database for inventory" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technology.operations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operations (POS/Inventory/Project Management)</FormLabel>
                    <FormControl>
                      <Input placeholder="Square POS, Zoho Inventory, Asana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technology.marketing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketing & Sales Tools</FormLabel>
                    <FormControl>
                      <Input placeholder="MailChimp, HubSpot CRM, Hootsuite" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="manualTasks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manual Tasks or Processes to Potentially Automate</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Manual invoice entry&#10;Copy-pasting client emails from spreadsheets"
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
              name="efficiencyImprovements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Areas Needing Efficiency Improvements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Inventory restocking notifications&#10;Customer follow-ups"
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

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="preferredContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Contact Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="Email" id="email" />
                        <Label htmlFor="email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="Phone" id="phone" />
                        <Label htmlFor="phone">Phone</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="Video Call" id="video" />
                        <Label htmlFor="video">Video Call</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes or Special Requests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please send a calendar invite&#10;I'm usually available afternoons"
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
          Thank you for your interest in our Business Efficiency & Savings Assessment!
          Please take 5–10 minutes to answer the following questions to help us understand
          your business and identify areas for improvement.
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
                      Submit and Contact Us
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