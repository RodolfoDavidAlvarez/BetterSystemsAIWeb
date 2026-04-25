import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, ArrowRight, CheckCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  question: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface ContactDialogProps {
  /** Element that triggers the dialog (usually a Button or Link). Wraps with DialogTrigger asChild. */
  children: ReactNode;
}

export default function ContactDialog({ children }: ContactDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", question: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formIdentifier: "Contact Popup",
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.question,
        }),
      });
      if (!response.ok) throw new Error("Failed to submit form");
      setIsSuccess(true);
      toast({ title: "Thanks!", description: "I'll get back to you within 24 hours." });
      form.reset();
      setTimeout(() => {
        setIsSuccess(false);
        setOpen(false);
      }, 2500);
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to send. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0">
        <div className="grid md:grid-cols-[260px_1fr]">
          {/* Left: Rodo portrait + identity (hidden on small screens, shown on md+) */}
          <div className="hidden md:flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
            <img
              src="/rodo-portrait.png"
              alt="Rodo Alvarez, founder of Better Systems AI"
              className="w-full aspect-square rounded-2xl object-cover shadow-lg ring-2 ring-white/10"
            />
            <div className="mt-5">
              <div className="text-lg font-semibold leading-tight">Rodo Alvarez</div>
              <div className="text-sm text-white/70">Founder, Better Systems AI</div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <a href="tel:6026370032" className="flex items-center gap-2 text-white/85 hover:text-white">
                <Phone className="h-4 w-4" />
                <span>(602) 637-0032</span>
              </a>
              <a href="mailto:rodolfo@bettersystems.ai" className="flex items-center gap-2 text-white/85 hover:text-white">
                <Mail className="h-4 w-4" />
                <span>rodolfo@bettersystems.ai</span>
              </a>
            </div>
            <div className="mt-auto pt-5 text-xs text-white/60">
              <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
              Free 15-min consultation
              <br />
              <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
              24-hour response time
            </div>
          </div>

          {/* Right: Form (or success state) */}
          <div className="p-6 md:p-8">
            {/* Mobile-only mini header with portrait */}
            <div className="md:hidden flex items-center gap-3 mb-4">
              <img
                src="/rodo-portrait.png"
                alt="Rodo Alvarez"
                className="w-14 h-14 rounded-full object-cover ring-1 ring-border"
              />
              <div>
                <div className="text-sm font-semibold">Rodo Alvarez</div>
                <div className="text-xs text-muted-foreground">Founder, Better Systems AI</div>
              </div>
            </div>

            {isSuccess ? (
              <div className="py-12 text-center">
                <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-1">Thanks!</h3>
                <p className="text-sm text-muted-foreground">I'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1">Let's talk</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Tell me about your business and I'll show you how AI can help.
                </p>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div>
                    <Input placeholder="Your name" {...form.register("name")} />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Input placeholder="Email" type="email" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Input placeholder="Phone" type="tel" {...form.register("phone")} />
                    {form.formState.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Textarea
                      placeholder="What are you trying to fix or automate?"
                      {...form.register("question")}
                      className="min-h-[110px]"
                    />
                    {form.formState.errors.question && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.question.message}</p>
                    )}
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Send message <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
