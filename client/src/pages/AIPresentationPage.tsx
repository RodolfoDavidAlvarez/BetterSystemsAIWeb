import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Download, Sparkles } from "lucide-react";
import { SEO } from "@/components/SEO";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  interestedInHelp: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AIPresentationPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      category: "",
      interestedInHelp: false,
    },
  });

  const selectedCategory = form.watch("category");

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/presentation-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          category: values.category,
          interestedInHelp: values.interestedInHelp || false,
          presentation: "cgcc-ai-2026",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setIsSuccess(true);
      toast({
        title: "You're in!",
        description: "Your download link is ready below.",
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or email rodolfo@bettersystems.ai",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <SEO
          title="AI in Business — Presentation Download | Better Systems AI"
          description="Download the full AI in Business presentation from Chandler-Gilbert Community College."
        />
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1321] to-[#0a0f1a] flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md bg-[#111827]/80 border-[#1e293b] backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Thank you!</h2>
                <p className="text-slate-400">
                  Your presentation download is ready.
                </p>
              </div>
              <a
                href="/presentations/ai-in-business-cgcc.pdf"
                download
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Presentation (PDF)
              </a>
              <p className="text-sm text-slate-500">
                Questions? Reach out at{" "}
                <a
                  href="mailto:rodolfo@bettersystems.ai"
                  className="text-blue-400 hover:underline"
                >
                  rodolfo@bettersystems.ai
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="AI in Business — Presentation Download | Better Systems AI"
        description="Submit your info to download the full AI in Business presentation from Chandler-Gilbert Community College."
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1321] to-[#0a0f1a] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <img
              src="/logo-transparent.png"
              alt="Better Systems AI"
              className="h-12 mx-auto mb-8"
            />
          </div>

          <Card className="bg-[#111827]/80 border-[#1e293b] backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-sm font-medium px-3 py-1 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  CGCC Guest Lecture
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  AI in Business
                </h1>
                <p className="text-slate-400 text-sm sm:text-base">
                  Submit your info to download the full presentation
                </p>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    className="bg-[#0a0f1a] border-[#1e293b] text-white placeholder:text-slate-500 focus:border-blue-500"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-400 text-xs">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    className="bg-[#0a0f1a] border-[#1e293b] text-white placeholder:text-slate-500 focus:border-blue-500"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-400 text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">
                    Phone <span className="text-slate-500 text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 555-5555"
                    className="bg-[#0a0f1a] border-[#1e293b] text-white placeholder:text-slate-500 focus:border-blue-500"
                    {...form.register("phone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">
                    I am a... <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("category", value);
                      if (value !== "Business Owner") {
                        form.setValue("interestedInHelp", false);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-[#0a0f1a] border-[#1e293b] text-white">
                      <SelectValue placeholder="Select one" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[#1e293b]">
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Business Owner">Business Owner</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-red-400 text-xs">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                {selectedCategory === "Business Owner" && (
                  <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <Checkbox
                      id="interestedInHelp"
                      className="mt-0.5 border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      checked={form.watch("interestedInHelp")}
                      onCheckedChange={(checked) =>
                        form.setValue("interestedInHelp", checked === true)
                      }
                    />
                    <Label
                      htmlFor="interestedInHelp"
                      className="text-slate-300 text-sm leading-snug cursor-pointer"
                    >
                      I'm looking to integrate AI systems and need help
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 h-12 text-base"
                >
                  {isSubmitting ? "Submitting..." : "Get the Presentation"}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-500">
                Presented by Rodo Alvarez, Better Systems AI
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
