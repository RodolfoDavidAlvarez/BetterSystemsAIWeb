import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import {
  Building2,
  User,
  Users,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  ArrowRight,
  Loader2
} from "lucide-react";

// ========== TYPES ==========
interface FormData {
  // Business Info
  businessName: string;
  legalBusinessName: string;
  industry: string;
  companySize: string;
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

  // Project Scope
  painPoints: string;
  currentTools: string;
  budgetRange: string;
  timeline: string;
  referralSource: string;
  additionalNotes: string;
}

const initialFormData: FormData = {
  businessName: "",
  legalBusinessName: "",
  industry: "",
  companySize: "",
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
  painPoints: "",
  currentTools: "",
  budgetRange: "",
  timeline: "",
  referralSource: "",
  additionalNotes: ""
};

// ========== STEP CONFIG ==========
const steps = [
  { id: 1, title: "Your Business", icon: Building2, description: "Tell us about your company" },
  { id: 2, title: "Primary Contact", icon: User, description: "Who's leading this project?" },
  { id: 3, title: "Team Contacts", icon: Users, description: "Operations & billing" },
  { id: 4, title: "Project Scope", icon: Briefcase, description: "What we're building together" },
];

// ========== COMPONENT ==========
export default function OnboardPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [direction, setDirection] = useState(1);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsComplete(true);
        toast({
          title: "Welcome aboard!",
          description: "Your information has been received. We'll be in touch soon!",
        });
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== COMPLETION SCREEN ==========
  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center p-4">
        <SEO
          title="Welcome | Better Systems AI"
          description="Thank you for onboarding with Better Systems AI"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"
          >
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
          >
            You're all set!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-300 mb-8"
          >
            Thank you for choosing Better Systems AI. Our team will review your information and reach out within 24 hours to schedule your kickoff call.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur"
          >
            <h3 className="font-semibold text-white mb-3">What happens next?</h3>
            <ul className="text-left text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-400 font-bold">1</span>
                </span>
                We review your business requirements
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-400 font-bold">2</span>
                </span>
                Schedule a discovery call to dive deeper
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-400 font-bold">3</span>
                </span>
                Present a customized AI solution proposal
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ========== MAIN FORM ==========
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <SEO
        title="Get Started | Better Systems AI"
        description="Begin your journey with Better Systems AI. Complete your onboarding to get started."
      />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Client Onboarding</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Let's build something great
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Complete your profile so we can tailor our AI solutions to your specific needs.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-700">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                        : isActive
                          ? "bg-white text-slate-900 shadow-lg shadow-white/20"
                          : "bg-slate-800 text-slate-500"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={3} />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span className={`mt-3 text-xs font-medium hidden md:block ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Step Title */}
          <div className="text-center mt-6 md:hidden">
            <span className="text-white font-medium">{steps[currentStep - 1].title}</span>
            <p className="text-slate-400 text-sm">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Form Container */}
        <motion.div
          className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-10 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Business Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Business Information</h2>
                    <p className="text-slate-400">Tell us about your company so we can serve you better.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField
                      label="Company Name"
                      placeholder="Acme Inc."
                      value={formData.businessName}
                      onChange={(v) => handleChange("businessName", v)}
                      required
                    />
                    <InputField
                      label="Legal Business Name"
                      placeholder="Acme Incorporated LLC"
                      value={formData.legalBusinessName}
                      onChange={(v) => handleChange("legalBusinessName", v)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <SelectField
                      label="Industry"
                      value={formData.industry}
                      onChange={(v) => handleChange("industry", v)}
                      options={[
                        { value: "", label: "Select your industry" },
                        { value: "construction", label: "Construction" },
                        { value: "solar", label: "Solar / Renewable Energy" },
                        { value: "fleet", label: "Fleet Management" },
                        { value: "real_estate", label: "Real Estate" },
                        { value: "healthcare", label: "Healthcare" },
                        { value: "retail", label: "Retail / E-commerce" },
                        { value: "manufacturing", label: "Manufacturing" },
                        { value: "professional_services", label: "Professional Services" },
                        { value: "other", label: "Other" },
                      ]}
                    />
                    <SelectField
                      label="Company Size"
                      value={formData.companySize}
                      onChange={(v) => handleChange("companySize", v)}
                      options={[
                        { value: "", label: "Select company size" },
                        { value: "1-10", label: "1-10 employees" },
                        { value: "11-50", label: "11-50 employees" },
                        { value: "51-200", label: "51-200 employees" },
                        { value: "201-500", label: "201-500 employees" },
                        { value: "500+", label: "500+ employees" },
                      ]}
                    />
                  </div>

                  <InputField
                    label="Website"
                    placeholder="https://yourcompany.com"
                    value={formData.website}
                    onChange={(v) => handleChange("website", v)}
                    type="url"
                  />
                </div>
              )}

              {/* Step 2: Primary Contact */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Primary Contact</h2>
                    <p className="text-slate-400">Who will be our main point of contact for this project?</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField
                      label="Full Name"
                      placeholder="John Smith"
                      value={formData.primaryContactName}
                      onChange={(v) => handleChange("primaryContactName", v)}
                      required
                    />
                    <InputField
                      label="Title / Position"
                      placeholder="CEO, Operations Manager, etc."
                      value={formData.primaryContactTitle}
                      onChange={(v) => handleChange("primaryContactTitle", v)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField
                      label="Email"
                      placeholder="john@company.com"
                      value={formData.primaryContactEmail}
                      onChange={(v) => handleChange("primaryContactEmail", v)}
                      type="email"
                      required
                    />
                    <InputField
                      label="Phone"
                      placeholder="(555) 123-4567"
                      value={formData.primaryContactPhone}
                      onChange={(v) => handleChange("primaryContactPhone", v)}
                      type="tel"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Team Contacts */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Team Contacts</h2>
                    <p className="text-slate-400">Who handles day-to-day operations and billing?</p>
                  </div>

                  {/* Operations Contact */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      Operations Contact
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField
                        label="Full Name"
                        placeholder="Jane Doe"
                        value={formData.operationsContactName}
                        onChange={(v) => handleChange("operationsContactName", v)}
                        compact
                      />
                      <InputField
                        label="Title"
                        placeholder="Operations Manager"
                        value={formData.operationsContactTitle}
                        onChange={(v) => handleChange("operationsContactTitle", v)}
                        compact
                      />
                      <InputField
                        label="Email"
                        placeholder="jane@company.com"
                        value={formData.operationsContactEmail}
                        onChange={(v) => handleChange("operationsContactEmail", v)}
                        type="email"
                        compact
                      />
                      <InputField
                        label="Phone"
                        placeholder="(555) 123-4567"
                        value={formData.operationsContactPhone}
                        onChange={(v) => handleChange("operationsContactPhone", v)}
                        type="tel"
                        compact
                      />
                    </div>
                  </div>

                  {/* Billing Contact */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-emerald-400" />
                      </div>
                      Billing Contact
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField
                        label="Full Name"
                        placeholder="Bob Johnson"
                        value={formData.billingContactName}
                        onChange={(v) => handleChange("billingContactName", v)}
                        compact
                      />
                      <InputField
                        label="Title"
                        placeholder="Accounting Manager"
                        value={formData.billingContactTitle}
                        onChange={(v) => handleChange("billingContactTitle", v)}
                        compact
                      />
                      <InputField
                        label="Email"
                        placeholder="billing@company.com"
                        value={formData.billingContactEmail}
                        onChange={(v) => handleChange("billingContactEmail", v)}
                        type="email"
                        compact
                      />
                      <InputField
                        label="Phone"
                        placeholder="(555) 123-4567"
                        value={formData.billingContactPhone}
                        onChange={(v) => handleChange("billingContactPhone", v)}
                        type="tel"
                        compact
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Project Scope */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Project Scope</h2>
                    <p className="text-slate-400">Help us understand what you're looking to achieve.</p>
                  </div>

                  <TextareaField
                    label="What challenges are you looking to solve?"
                    placeholder="Describe the pain points in your current workflow, manual processes that take too much time, or areas where you'd like to see improvement..."
                    value={formData.painPoints}
                    onChange={(v) => handleChange("painPoints", v)}
                    rows={4}
                  />

                  <InputField
                    label="Current Tools & Software"
                    placeholder="QuickBooks, Excel, Salesforce, custom apps, etc."
                    value={formData.currentTools}
                    onChange={(v) => handleChange("currentTools", v)}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <SelectField
                      label="Budget Range"
                      value={formData.budgetRange}
                      onChange={(v) => handleChange("budgetRange", v)}
                      options={[
                        { value: "", label: "Select budget range" },
                        { value: "under_5k", label: "Under $5,000" },
                        { value: "5k_15k", label: "$5,000 - $15,000" },
                        { value: "15k_50k", label: "$15,000 - $50,000" },
                        { value: "50k_plus", label: "$50,000+" },
                        { value: "ongoing", label: "Ongoing retainer" },
                      ]}
                    />
                    <SelectField
                      label="Timeline"
                      value={formData.timeline}
                      onChange={(v) => handleChange("timeline", v)}
                      options={[
                        { value: "", label: "Select timeline" },
                        { value: "asap", label: "ASAP" },
                        { value: "1_month", label: "Within 1 month" },
                        { value: "3_months", label: "Within 3 months" },
                        { value: "6_months", label: "Within 6 months" },
                        { value: "exploring", label: "Just exploring" },
                      ]}
                    />
                  </div>

                  <SelectField
                    label="How did you hear about us?"
                    value={formData.referralSource}
                    onChange={(v) => handleChange("referralSource", v)}
                    options={[
                      { value: "", label: "Select an option" },
                      { value: "referral", label: "Referral" },
                      { value: "google", label: "Google Search" },
                      { value: "linkedin", label: "LinkedIn" },
                      { value: "social_media", label: "Social Media" },
                      { value: "existing_client", label: "Existing Client" },
                      { value: "other", label: "Other" },
                    ]}
                  />

                  <TextareaField
                    label="Anything else we should know?"
                    placeholder="Additional context, specific requirements, or questions..."
                    value={formData.additionalNotes}
                    onChange={(v) => handleChange("additionalNotes", v)}
                    rows={3}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? "text-slate-600 cursor-not-allowed"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Onboarding
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Your information is secure and will never be shared with third parties.
        </p>
      </div>
    </div>
  );
}

// ========== FORM COMPONENTS ==========

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  compact?: boolean;
}

function InputField({ label, placeholder, value, onChange, type = "text", required, compact }: InputFieldProps) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${
          compact ? "px-4 py-2.5 text-sm" : "px-4 py-3"
        }`}
        required={required}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

function TextareaField({ label, placeholder, value, onChange, rows = 4 }: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
      />
    </div>
  );
}
