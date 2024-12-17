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

interface FormStep {
  title: string;
  description: string;
}

export default function PreAssessmentQuestionnairePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    otherIndustry: "",
    fullTimeEmployees: "",
    partTimeEmployees: "",
    primaryProducts: "",
    timeConsumingTasks: [] as string[],
    repetitiveTasks: "",
    operationsTracking: [] as string[],
    annualRevenue: "",
    laborCost: "",
    automationTools: "",
    challenges: "",
    timeUsage: "",
    businessGoals: [] as string[],
    name: "",
    email: "",
    phone: "",
    preferredTime: ""
  });

  const steps: FormStep[] = [
    {
      title: "Business Overview",
      description: "Tell us about your business structure and operations"
    },
    {
      title: "Current Operations",
      description: "Help us understand your day-to-day processes"
    },
    {
      title: "Financial Metrics",
      description: "Share some basic financial information to help us assess potential savings"
    },
    {
      title: "Goals and Challenges",
      description: "Let us know what you're trying to achieve"
    },
    {
      title: "Contact Information",
      description: "How can we reach you to discuss the assessment?"
    }
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Here you would typically send the form data to your backend
    console.log("Form submitted:", formData);
    // Redirect to booking page after submission
    window.location.href = "/booking";
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>Industry</Label>
              <RadioGroup
                value={formData.industry}
                onValueChange={(value) => handleInputChange("industry", value)}
              >
                {["Retail", "Manufacturing", "Professional Services", "Healthcare", "Other"].map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <RadioGroupItem value={industry} id={industry} />
                    <Label htmlFor={industry}>{industry}</Label>
                  </div>
                ))}
              </RadioGroup>
              {formData.industry === "Other" && (
                <Input
                  placeholder="Please specify"
                  value={formData.otherIndustry}
                  onChange={(e) => handleInputChange("otherIndustry", e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label htmlFor="fullTimeEmployees">Full-Time Employees</Label>
                <Input
                  id="fullTimeEmployees"
                  type="number"
                  value={formData.fullTimeEmployees}
                  onChange={(e) => handleInputChange("fullTimeEmployees", e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="partTimeEmployees">Part-Time Employees</Label>
                <Input
                  id="partTimeEmployees"
                  type="number"
                  value={formData.partTimeEmployees}
                  onChange={(e) => handleInputChange("partTimeEmployees", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="primaryProducts">What are your primary products or services?</Label>
              <Textarea
                id="primaryProducts"
                value={formData.primaryProducts}
                onChange={(e) => handleInputChange("primaryProducts", e.target.value)}
              />
            </div>
          </div>
        );

      case 1:
        const taskOptions = [
          "Data entry",
          "Invoicing or billing",
          "Managing inventory",
          "Customer support",
          "Scheduling or coordinating",
          "Payroll or HR tasks",
          "Marketing",
          "Sales follow-ups"
        ];

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>What are the most time-consuming tasks in your business? (Choose up to 3)</Label>
              <div className="grid grid-cols-2 gap-4">
                {taskOptions.map((task) => (
                  <div key={task} className="flex items-center space-x-2">
                    <Checkbox
                      id={task}
                      checked={formData.timeConsumingTasks.includes(task)}
                      onCheckedChange={(checked) => {
                        const tasks = checked
                          ? [...formData.timeConsumingTasks, task].slice(0, 3)
                          : formData.timeConsumingTasks.filter(t => t !== task);
                        handleInputChange("timeConsumingTasks", tasks);
                      }}
                    />
                    <Label htmlFor={task}>{task}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="repetitiveTasks">Which tasks do you feel are repetitive or inefficient?</Label>
              <Textarea
                id="repetitiveTasks"
                value={formData.repetitiveTasks}
                onChange={(e) => handleInputChange("repetitiveTasks", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>How do you currently track and manage your business operations?</Label>
              <div className="space-y-2">
                {["Spreadsheets", "Manual processes", "Software tools"].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={method}
                      checked={formData.operationsTracking.includes(method)}
                      onCheckedChange={(checked) => {
                        const methods = checked
                          ? [...formData.operationsTracking, method]
                          : formData.operationsTracking.filter(m => m !== method);
                        handleInputChange("operationsTracking", methods);
                      }}
                    />
                    <Label htmlFor={method}>{method}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>What is your estimated annual revenue?</Label>
              <RadioGroup
                value={formData.annualRevenue}
                onValueChange={(value) => handleInputChange("annualRevenue", value)}
              >
                {[
                  "Less than $100,000",
                  "$100,000–$500,000",
                  "$500,000–$1,000,000",
                  "Over $1,000,000"
                ].map((range) => (
                  <div key={range} className="flex items-center space-x-2">
                    <RadioGroupItem value={range} id={range} />
                    <Label htmlFor={range}>{range}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label>What is your estimated annual labor cost?</Label>
              <RadioGroup
                value={formData.laborCost}
                onValueChange={(value) => handleInputChange("laborCost", value)}
              >
                {[
                  "Less than $50,000",
                  "$50,000–$100,000",
                  "$100,000–$250,000",
                  "Over $250,000"
                ].map((range) => (
                  <div key={range} className="flex items-center space-x-2">
                    <RadioGroupItem value={range} id={range} />
                    <Label htmlFor={range}>{range}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label htmlFor="automationTools">Do you currently use any automation or AI tools?</Label>
              <Textarea
                id="automationTools"
                placeholder="If yes, please specify which tools"
                value={formData.automationTools}
                onChange={(e) => handleInputChange("automationTools", e.target.value)}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="challenges">What are the top 3 challenges you're facing in your business?</Label>
              <Textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => handleInputChange("challenges", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="timeUsage">If you could save 10–20 hours per week, how would you use that time?</Label>
              <Textarea
                id="timeUsage"
                value={formData.timeUsage}
                onChange={(e) => handleInputChange("timeUsage", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>What are your primary business goals for the next 12 months?</Label>
              <div className="space-y-2">
                {[
                  "Increase revenue",
                  "Reduce costs",
                  "Improve customer satisfaction",
                  "Expand your team"
                ].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.businessGoals.includes(goal)}
                      onCheckedChange={(checked) => {
                        const goals = checked
                          ? [...formData.businessGoals, goal]
                          : formData.businessGoals.filter(g => g !== goal);
                        handleInputChange("businessGoals", goals);
                      }}
                    />
                    <Label htmlFor={goal}>{goal}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>Preferred Time for Consultation</Label>
              <RadioGroup
                value={formData.preferredTime}
                onValueChange={(value) => handleInputChange("preferredTime", value)}
              >
                {["Morning", "Afternoon", "Evening"].map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <RadioGroupItem value={time} id={time} />
                    <Label htmlFor={time}>{time}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
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

            {renderStep()}

            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleSubmit}>
                  Submit and Book Consultation
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next Step
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
