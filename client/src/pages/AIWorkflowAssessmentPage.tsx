import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ChevronRight, Sparkles, Clock, Brain, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeIn } from "@/lib/animations";

// Form schema for the assessment quiz
const formSchema = z.object({
  // Personal Information
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string().optional(),
  company: z.string().min(2, { message: "Company name is required" }),
  
  // Business Details
  industry: z.string().min(1, { message: "Please select an industry" }),
  companySize: z.string().min(1, { message: "Please select your company size" }),
  
  // Current Workflows
  currentTechnologies: z.array(z.string()).optional(),
  manualProcesses: z.string().min(10, { message: "Please describe at least one manual process" }),
  communicationTools: z.string().optional(),
  
  // Goals & Pain Points
  businessGoals: z.string().min(10, { message: "Please describe your business goals" }),
  painPoints: z.string().min(10, { message: "Please describe your pain points" }),
  
  // AI Readiness
  aiExperience: z.string(),
  dataAvailability: z.string(),
  budgetRange: z.string().optional(),
  implementationTimeline: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormStep {
  title: string;
  description: string;
}

export default function AIWorkflowAssessmentPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingResults, setIsGeneratingResults] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      industry: "",
      companySize: "",
      currentTechnologies: [],
      manualProcesses: "",
      communicationTools: "",
      businessGoals: "",
      painPoints: "",
      aiExperience: "",
      dataAvailability: "",
      budgetRange: "",
      implementationTimeline: "",
    },
  });

  const steps: FormStep[] = [
    {
      title: "Your Information",
      description: "Let's start with your basic information"
    },
    {
      title: "Business Details",
      description: "Tell us about your company"
    },
    {
      title: "Current Workflows",
      description: "How do you currently operate?"
    },
    {
      title: "Goals & Pain Points",
      description: "What are you looking to improve?"
    },
    {
      title: "AI Readiness",
      description: "Let's assess your AI implementation readiness"
    },
  ];

  const getFieldsForStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return ['name', 'email', 'phone', 'company'];
      case 1:
        return ['industry', 'companySize'];
      case 2:
        return ['currentTechnologies', 'manualProcesses', 'communicationTools'];
      case 3:
        return ['businessGoals', 'painPoints'];
      case 4:
        return ['aiExperience', 'dataAvailability', 'budgetRange', 'implementationTimeline'];
      default:
        return [];
    }
  };

  const validateStep = async () => {
    const fields = getFieldsForStep(step);
    const result = await form.trigger(fields as any);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (!isValid) return;

    if (step < steps.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // This simulates generating AI recommendations based on the form input
  const generateAIRecommendations = (formData: FormValues) => {
    // In a real implementation, this would make an API call to an AI service
    // For now, we'll simulate the response with some tailored recommendations
    
    const industry = formData.industry;
    const manualProcesses = formData.manualProcesses;
    const painPoints = formData.painPoints;
    const businessGoals = formData.businessGoals;
    
    // Generate recommendations based on the industry
    let industryRecommendations: string[] = [];
    let workflowAutomationIdeas: string[] = [];
    let aiIntegrationOptions: string[] = [];
    let expectedBenefits: {title: string, description: string}[] = [];
    
    // Industry-specific recommendations
    switch(industry) {
      case "retail":
        industryRecommendations = [
          "Implement inventory management AI to predict stock levels and automate reordering",
          "Deploy customer analytics to personalize shopping experiences and recommendations",
          "Set up automated email marketing flows based on customer behavior",
          "Use computer vision for store analytics and customer flow optimization"
        ];
        break;
      case "healthcare":
        industryRecommendations = [
          "Implement patient scheduling automation to reduce no-shows",
          "Use natural language processing for medical documentation",
          "Deploy predictive analytics for patient risk assessment",
          "Automate insurance verification and billing processes"
        ];
        break;
      case "manufacturing":
        industryRecommendations = [
          "Deploy predictive maintenance AI to reduce equipment downtime",
          "Implement quality control automation with computer vision",
          "Use digital twins for production line optimization",
          "Automate inventory and supply chain management with AI forecasting"
        ];
        break;
      case "technology":
        industryRecommendations = [
          "Implement AI-powered development tools for code optimization",
          "Deploy automated testing and QA workflows",
          "Use natural language processing for customer support automation",
          "Implement intelligent project management with predictive resource allocation"
        ];
        break;
      case "finance":
        industryRecommendations = [
          "Deploy fraud detection AI systems for real-time transaction monitoring",
          "Implement automated document processing for loan applications",
          "Use predictive analytics for investment portfolio optimization",
          "Automate regulatory compliance reporting and risk assessment"
        ];
        break;
      default:
        industryRecommendations = [
          "Implement document automation for administrative tasks",
          "Deploy AI-powered customer service tools with chatbots",
          "Use data analytics to identify operational inefficiencies",
          "Implement workflow automation for repetitive business processes"
        ];
    }
    
    // General workflow automation ideas based on common pain points
    workflowAutomationIdeas = [
      "Email automation and response templates for common inquiries",
      "Document processing and information extraction with OCR and NLP",
      "Meeting scheduling and calendar management automation",
      "Automated data entry and validation workflows",
      "Intelligent process routing and approval automation",
      "Automated reporting and business intelligence dashboards"
    ];
    
    // AI integration options
    aiIntegrationOptions = [
      "Custom AI assistants tailored to your specific business processes",
      "Workflow analysis and automation implementation",
      "Integration of existing tools with AI capabilities",
      "Data infrastructure optimization for AI readiness",
      "Employee training and AI adoption programs"
    ];
    
    // Expected benefits
    expectedBenefits = [
      {
        title: "Time Savings",
        description: "Reduce time spent on manual tasks by 30-50% through intelligent automation"
      },
      {
        title: "Error Reduction",
        description: "Minimize human error in data processing and decision-making by up to 90%"
      },
      {
        title: "Cost Efficiency",
        description: "Lower operational costs through optimized resource allocation and process automation"
      },
      {
        title: "Improved Insights",
        description: "Gain deeper business intelligence through AI-powered data analysis"
      },
      {
        title: "Enhanced Customer Experience",
        description: "Deliver faster, more personalized service through intelligent automation"
      }
    ];
    
    return {
      industryRecommendations,
      workflowAutomationIdeas,
      aiIntegrationOptions,
      expectedBenefits
    };
  };

  const handleSubmit = async () => {
    if (!(await validateStep())) return;
    
    setIsSubmitting(true);
    setIsGeneratingResults(true);
    
    try {
      // Get form values
      const values = form.getValues();
      
      // In a real implementation, you would send this data to your server
      console.log('Form values:', values);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate AI recommendations based on form input
      const results = generateAIRecommendations(values);
      setAssessmentResults(results);
      
      setIsGeneratingResults(false);
      setShowResults(true);
      
      toast({
        title: "Assessment complete!",
        description: "We've analyzed your business needs and generated AI workflow recommendations.",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Something went wrong",
        description: "We couldn't process your assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResults && assessmentResults) {
    return (
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Your AI Workflow Assessment Results</h1>
            <p className="text-xl text-muted-foreground">
              Based on your responses, we've identified the following AI opportunities for your business.
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Industry-Specific Recommendations */}
            <Card>
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <CardTitle>Industry-Specific AI Recommendations</CardTitle>
                </div>
                <CardDescription>
                  Tailored solutions for your specific business sector
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {assessmentResults.industryRecommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Workflow Automation Ideas */}
            <Card>
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <CardTitle>Workflow Automation Opportunities</CardTitle>
                </div>
                <CardDescription>
                  Processes that can be automated to improve efficiency
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {assessmentResults.workflowAutomationIdeas.map((idea: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* AI Integration Options */}
            <Card>
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-2">
                  <Robot className="h-6 w-6 text-primary" />
                  <CardTitle>AI Integration Options</CardTitle>
                </div>
                <CardDescription>
                  Ways Better Systems AI can help implement these solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {assessmentResults.aiIntegrationOptions.map((option: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Expected Benefits */}
            <Card>
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <CardTitle>Expected Benefits</CardTitle>
                </div>
                <CardDescription>
                  What you can expect from implementing AI solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {assessmentResults.expectedBenefits.map((benefit: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* CTA */}
            <div className="bg-primary/5 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Implement These Solutions?</h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Our team of AI experts can help you transform these recommendations into reality.
                Get started with a custom solution tailored to your specific needs.
              </p>
              <Link href="/get-started">
                <Button size="lg" className="px-8">
                  Request a Custom Solution
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-3xl mx-auto"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">AI Workflow Assessment</h1>
          <p className="text-xl text-muted-foreground">
            Discover how AI can transform your business operations with our free assessment.
          </p>
        </div>
        
        {/* Progress indicators */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((s, i) => (
              <div 
                key={i} 
                className={`text-sm font-medium ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Step {i + 1}
              </div>
            ))}
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-semibold">{steps[step].title}</h2>
            <p className="text-muted-foreground">{steps[step].description}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          <Form {...form}>
            <form className="space-y-6">
              {/* STEP 1: Personal Information */}
              {step === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email address" type="email" {...field} />
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
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
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
                          <Input placeholder="Enter your company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* STEP 2: Business Details */}
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
                            <SelectItem value="retail">Retail & E-commerce</SelectItem>
                            <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="technology">Technology & Software</SelectItem>
                            <SelectItem value="finance">Finance & Banking</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="logistics">Logistics & Transportation</SelectItem>
                            <SelectItem value="hospitality">Hospitality & Tourism</SelectItem>
                            <SelectItem value="legal">Legal Services</SelectItem>
                            <SelectItem value="construction">Construction & Real Estate</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your company size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solo">Solo Entrepreneur</SelectItem>
                            <SelectItem value="micro">Micro (2-10 employees)</SelectItem>
                            <SelectItem value="small">Small (11-50 employees)</SelectItem>
                            <SelectItem value="medium">Medium (51-250 employees)</SelectItem>
                            <SelectItem value="large">Large (251+ employees)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* STEP 3: Current Workflows */}
              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="manualProcesses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manual Processes & Workflows</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the manual or time-consuming processes in your business that you'd like to improve..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="communicationTools"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Tools & Software</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List the tools and software you currently use for business operations (e.g., Excel, QuickBooks, Salesforce, etc.)..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* STEP 4: Goals & Pain Points */}
              {step === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Goals</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are your primary business goals for the next 12 months?"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="painPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pain Points & Challenges</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are the biggest operational challenges or inefficiencies you face?"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* STEP 5: AI Readiness */}
              {step === 4 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="aiExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your AI experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None - We've never used AI</SelectItem>
                            <SelectItem value="beginner">Beginner - We've used basic AI tools</SelectItem>
                            <SelectItem value="intermediate">Intermediate - We have some AI implementations</SelectItem>
                            <SelectItem value="advanced">Advanced - We use AI extensively</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dataAvailability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Availability</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your data availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="minimal">Minimal - We have very little digital data</SelectItem>
                            <SelectItem value="some">Some - We have some digital records</SelectItem>
                            <SelectItem value="substantial">Substantial - Most of our data is digital</SelectItem>
                            <SelectItem value="complete">Complete - All our processes are digitally documented</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="budgetRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your budget range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="minimal">Under $5,000</SelectItem>
                            <SelectItem value="small">$5,000 - $25,000</SelectItem>
                            <SelectItem value="medium">$25,000 - $100,000</SelectItem>
                            <SelectItem value="large">$100,000+</SelectItem>
                            <SelectItem value="undecided">Undecided</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="implementationTimeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Implementation Timeline (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your implementation timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate (1-2 months)</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="sixMonths">Next 6 Months</SelectItem>
                            <SelectItem value="year">Within a Year</SelectItem>
                            <SelectItem value="exploratory">Just Exploring Options</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={step === 0}
                >
                  Previous
                </Button>
                
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      {isGeneratingResults ? 'Analyzing your business...' : 'Processing...'}
                    </>
                  ) : (
                    step === steps.length - 1 ? (
                      'Get AI Recommendations'
                    ) : (
                      'Next'
                    )
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        {/* Benefits of AI Workflow */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">How AI Can Transform Your Business</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Save Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Automate repetitive tasks and workflows to free up valuable time for strategic initiatives.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Reduce Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Minimize human error with AI-powered processes that ensure accuracy and consistency.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Gain Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Extract meaningful patterns and insights from your business data to make better decisions.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}