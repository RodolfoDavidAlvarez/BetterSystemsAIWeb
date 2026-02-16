import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Star } from "lucide-react";
import { SEO } from "@/components/SEO";

interface ReviewFormData {
  clientId?: number;
  projectId?: number;
  phase?: string;
  reviewerName: string;
  reviewerEmail: string;
  companyName?: string;
  rating: number;
  comment: string;
}

export default function ReviewSurveyPage() {
  const [formData, setFormData] = useState<ReviewFormData>({
    reviewerName: "",
    reviewerEmail: "",
    companyName: "",
    phase: "",
    rating: 0,
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("clientId");
    const projectId = params.get("projectId");
    const phase = params.get("phase");
    const name = params.get("name");
    const email = params.get("email");
    const company = params.get("company");

    setFormData((prev) => ({
      ...prev,
      clientId: clientId ? Number(clientId) : undefined,
      projectId: projectId ? Number(projectId) : undefined,
      phase: phase || "",
      reviewerName: name || prev.reviewerName,
      reviewerEmail: email || prev.reviewerEmail,
      companyName: company || prev.companyName,
    }));
  }, []);

  const setField = <K extends keyof ReviewFormData>(field: K, value: ReviewFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.rating) {
      setErrorMessage("Please select a star rating.");
      return;
    }

    if (formData.comment.trim().length < 10) {
      setErrorMessage("Please share at least 10 characters in your review.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit review");
      }

      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-slate-100 py-16 px-4">
      <SEO
        title="Project Phase Review | Better Systems AI"
        description="Share feedback on your completed project phase."
        path="/review"
      />
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-3xl">Project Phase Review</CardTitle>
            <CardDescription>
              Your feedback helps us improve and deliver stronger outcomes in the next phase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Thank you for your review</h2>
                <p className="text-muted-foreground">
                  We appreciate your feedback and will use it to improve your next project phase.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewerName">Name</Label>
                    <Input
                      id="reviewerName"
                      value={formData.reviewerName}
                      onChange={(e) => setField("reviewerName", e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewerEmail">Email</Label>
                    <Input
                      id="reviewerEmail"
                      type="email"
                      value={formData.reviewerEmail}
                      onChange={(e) => setField("reviewerEmail", e.target.value)}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName || ""}
                      onChange={(e) => setField("companyName", e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phase">Project Phase</Label>
                    <Input
                      id="phase"
                      value={formData.phase || ""}
                      onChange={(e) => setField("phase", e.target.value)}
                      placeholder="Example: Discovery, MVP, Launch"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setField("rating", star)}
                        className="p-1"
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-8 w-8 ${star <= formData.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setField("comment", e.target.value)}
                    placeholder="How did this project phase go? What worked well? What could be improved?"
                    className="min-h-[150px]"
                    required
                  />
                </div>

                {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
