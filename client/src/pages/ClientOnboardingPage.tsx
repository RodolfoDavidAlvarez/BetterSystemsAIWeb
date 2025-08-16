import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Building2, User, Mail, Phone, MapPin, Users, CreditCard, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

interface FormData {
  // Business Information
  businessName: string;
  legalBusinessName: string;
  businessAddress: string;
  businessPhone: string;
  website: string;
  
  // Primary Contact
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  
  // Operations Contact
  operationsContactName: string;
  operationsContactTitle: string;
  operationsContactEmail: string;
  operationsContactPhone: string;
  
  // Billing Contact
  billingContactName: string;
  billingContactTitle: string;
  billingContactEmail: string;
  billingContactPhone: string;
  
  // Additional Information
  additionalNotes: string;
}

export default function ClientOnboardingPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    legalBusinessName: "",
    businessAddress: "",
    businessPhone: "",
    website: "",
    primaryContactName: "",
    primaryContactTitle: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    operationsContactName: "",
    operationsContactTitle: "",
    operationsContactEmail: "",
    operationsContactPhone: "",
    billingContactName: "",
    billingContactTitle: "",
    billingContactEmail: "",
    billingContactPhone: "",
    additionalNotes: ""
  });

  const totalSteps = 4;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/client-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to submit");

      setIsCompleted(true);
      toast({
        title: "Welcome aboard!",
        description: "Your information has been successfully submitted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-muted-foreground mb-2">
            Your onboarding information has been received.
          </p>
          <p className="text-muted-foreground">
            Our team will review your details and reach out within 24 hours to schedule your kickoff meeting.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <SEO 
        title="Client Onboarding"
        description="Welcome to Better Systems AI. Complete your onboarding information to get started with our AI solutions."
      />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome Aboard to Better Systems AI! 🎉
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're excited to partner with you! Please take a few minutes to provide your business information 
            so we can customize our AI solutions to perfectly fit your needs.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">
              {currentStep === 1 && "Business Information"}
              {currentStep === 2 && "Primary Contact"}
              {currentStep === 3 && "Key Team Members"}
              {currentStep === 4 && "Additional Details"}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <><Building2 className="h-5 w-5" /> Business Information</>}
              {currentStep === 2 && <><User className="h-5 w-5" /> Primary Contact</>}
              {currentStep === 3 && <><Users className="h-5 w-5" /> Key Team Members</>}
              {currentStep === 4 && <><CreditCard className="h-5 w-5" /> Additional Details</>}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your business"}
              {currentStep === 2 && "Who will be our main point of contact?"}
              {currentStep === 3 && "Who handles operations and billing?"}
              {currentStep === 4 && "Any additional information we should know?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleSubmit} 
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
                  e.preventDefault();
                }
              }}
              className="space-y-6"
            >
              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name*</Label>
                      <Input
                        id="businessName"
                        placeholder="Your Company"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalBusinessName">Legal Business Name*</Label>
                      <Input
                        id="legalBusinessName"
                        placeholder="Your Company LLC"
                        value={formData.legalBusinessName}
                        onChange={(e) => handleInputChange("legalBusinessName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address*</Label>
                    <Textarea
                      id="businessAddress"
                      placeholder="123 Main St, Suite 100, City, State 12345"
                      value={formData.businessAddress}
                      onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Business Phone*</Label>
                      <Input
                        id="businessPhone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.businessPhone}
                        onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Primary Contact */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactName">Full Name*</Label>
                      <Input
                        id="primaryContactName"
                        placeholder="John Smith"
                        value={formData.primaryContactName}
                        onChange={(e) => handleInputChange("primaryContactName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactTitle">Title/Position*</Label>
                      <Input
                        id="primaryContactTitle"
                        placeholder="CEO"
                        value={formData.primaryContactTitle}
                        onChange={(e) => handleInputChange("primaryContactTitle", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactEmail">Email*</Label>
                      <Input
                        id="primaryContactEmail"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.primaryContactEmail}
                        onChange={(e) => handleInputChange("primaryContactEmail", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactPhone">Direct Phone*</Label>
                      <Input
                        id="primaryContactPhone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.primaryContactPhone}
                        onChange={(e) => handleInputChange("primaryContactPhone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Key Team Members */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Operations Contact */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Day-to-Day Operations Contact</h3>
                    <p className="text-sm text-muted-foreground">Who will handle the daily implementation?</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="operationsContactName">Full Name*</Label>
                        <Input
                          id="operationsContactName"
                          placeholder="Jane Doe"
                          value={formData.operationsContactName}
                          onChange={(e) => handleInputChange("operationsContactName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="operationsContactTitle">Title/Position*</Label>
                        <Input
                          id="operationsContactTitle"
                          placeholder="Operations Manager"
                          value={formData.operationsContactTitle}
                          onChange={(e) => handleInputChange("operationsContactTitle", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="operationsContactEmail">Email*</Label>
                        <Input
                          id="operationsContactEmail"
                          type="email"
                          placeholder="jane@company.com"
                          value={formData.operationsContactEmail}
                          onChange={(e) => handleInputChange("operationsContactEmail", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="operationsContactPhone">Direct Phone*</Label>
                        <Input
                          id="operationsContactPhone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.operationsContactPhone}
                          onChange={(e) => handleInputChange("operationsContactPhone", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Contact */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Billing & Invoicing Contact</h3>
                    <p className="text-sm text-muted-foreground">Who handles payments and invoices?</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingContactName">Full Name*</Label>
                        <Input
                          id="billingContactName"
                          placeholder="Bob Johnson"
                          value={formData.billingContactName}
                          onChange={(e) => handleInputChange("billingContactName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingContactTitle">Title/Position*</Label>
                        <Input
                          id="billingContactTitle"
                          placeholder="Accounting Manager"
                          value={formData.billingContactTitle}
                          onChange={(e) => handleInputChange("billingContactTitle", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingContactEmail">Email*</Label>
                        <Input
                          id="billingContactEmail"
                          type="email"
                          placeholder="billing@company.com"
                          value={formData.billingContactEmail}
                          onChange={(e) => handleInputChange("billingContactEmail", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingContactPhone">Direct Phone*</Label>
                        <Input
                          id="billingContactPhone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.billingContactPhone}
                          onChange={(e) => handleInputChange("billingContactPhone", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Additional Details */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Anything else we should know? (optional)</Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="Special requirements, preferred communication times, specific goals, etc."
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.stopPropagation();
                        }
                      }}
                      rows={6}
                    />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">What happens next?</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• We'll review your information within 24 hours</li>
                      <li>• Schedule a kickoff meeting to discuss your specific needs</li>
                      <li>• Begin customizing your AI solution</li>
                      <li>• Start your journey to 90% cost reduction!</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={handleNext}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Submitting...
                      </span>
                    ) : (
                      "Complete Onboarding"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}