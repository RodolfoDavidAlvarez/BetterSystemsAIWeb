import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

type BookingStep = "date" | "time" | "details" | "confirmation";

interface TimeSlot {
  time: string;
  display: string;
  available: boolean;
}

// Generate pseudo-random unavailable slots based on date
function getUnavailableSlots(date: Date): Set<string> {
  const dateStr = date.toISOString().split("T")[0];
  const hash = dateStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const unavailable = new Set<string>();

  // Make 3-5 slots unavailable per day based on date hash
  const numUnavailable = 3 + (hash % 3);
  const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

  for (let i = 0; i < numUnavailable; i++) {
    const slotIndex = (hash + i * 7) % slots.length;
    unavailable.add(slots[slotIndex]);
  }

  return unavailable;
}

// Generate time slots for a given date
function generateTimeSlots(date: Date): TimeSlot[] {
  const unavailable = getUnavailableSlots(date);
  const slots: TimeSlot[] = [];

  // Morning slots (9 AM - 12 PM)
  for (let hour = 9; hour < 12; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      const display = `${displayHour}:${min.toString().padStart(2, "0")} ${ampm}`;
      slots.push({ time, display, available: !unavailable.has(time) });
    }
  }

  // Afternoon slots (1 PM - 5 PM)
  for (let hour = 13; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = "PM";
      const display = `${displayHour}:${min.toString().padStart(2, "0")} ${ampm}`;
      slots.push({ time, display, available: !unavailable.has(time) });
    }
  }

  return slots;
}

export default function BookingPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<BookingStep>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    interest: "",
    notes: "",
  });

  // Calculate minimum booking date (3 days from now)
  const minDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Calculate maximum booking date (60 days from now)
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date;
  }, []);

  // Disable weekends and dates before minDate
  const disabledDays = useMemo(() => {
    return [
      { before: minDate },
      { after: maxDate },
      { dayOfWeek: [0, 6] }, // Sunday = 0, Saturday = 6
    ];
  }, [minDate, maxDate]);

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (date) {
      setStep("time");
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("details");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("confirmation");
      } else {
        toast({
          title: "Booking Failed",
          description: result.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSelectedTimeDisplay = () => {
    const slot = timeSlots.find((s) => s.time === selectedTime);
    return slot?.display || selectedTime;
  };

  return (
    <>
      <Helmet>
        <title>Book a Discovery Call | Better Systems AI</title>
        <meta name="description" content="Schedule a free 15-minute discovery call to discuss how we can automate your business." />
      </Helmet>

      <section className="min-h-screen pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Book a Discovery Call
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Schedule a free 15-minute call to discuss your business automation needs.
              We'll explore how we can help you save time and scale.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-1 ${step === "date" ? "text-primary font-medium" : step === "time" || step === "details" || step === "confirmation" ? "text-green-500" : "text-muted-foreground"}`}>
                <CalendarDays className="w-4 h-4" />
                <span>Date</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className={`flex items-center gap-1 ${step === "time" ? "text-primary font-medium" : step === "details" || step === "confirmation" ? "text-green-500" : "text-muted-foreground"}`}>
                <Clock className="w-4 h-4" />
                <span>Time</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className={`flex items-center gap-1 ${step === "details" ? "text-primary font-medium" : step === "confirmation" ? "text-green-500" : "text-muted-foreground"}`}>
                <span>Details</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className={`flex items-center gap-1 ${step === "confirmation" ? "text-green-500 font-medium" : "text-muted-foreground"}`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>Done</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-card rounded-xl border shadow-lg p-6 md:p-8">
            {/* Step 1: Date Selection */}
            {step === "date" && (
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-6">Select a Date</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Earliest availability is 3 days from today. Weekends are not available.
                </p>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={disabledDays}
                  className="rounded-md border"
                  fromDate={minDate}
                  toDate={maxDate}
                />
              </div>
            )}

            {/* Step 2: Time Selection */}
            {step === "time" && selectedDate && (
              <div>
                <button
                  onClick={() => setStep("date")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to calendar
                </button>

                <h2 className="text-xl font-semibold mb-2">Select a Time</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {formatSelectedDate()} • 15-minute call
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        slot.available
                          ? "hover:border-primary hover:bg-primary/5 cursor-pointer"
                          : "opacity-40 cursor-not-allowed line-through bg-muted/50"
                      } ${
                        selectedTime === slot.time
                          ? "border-primary bg-primary text-primary-foreground"
                          : ""
                      }`}
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Details Form */}
            {step === "details" && (
              <div>
                <button
                  onClick={() => setStep("time")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to time selection
                </button>

                <h2 className="text-xl font-semibold mb-2">Your Details</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {formatSelectedDate()} at {getSelectedTimeDisplay()}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest">What are you interested in?</Label>
                    <select
                      id="interest"
                      name="interest"
                      value={formData.interest}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select an option...</option>
                      <option value="lead-nurturing">Lead Nurturing System</option>
                      <option value="booking-system">Automated Booking System</option>
                      <option value="client-portal">Client Portal</option>
                      <option value="quote-invoice">Quote & Invoice Generator</option>
                      <option value="sms-notifications">SMS Notification System</option>
                      <option value="ai-documents">AI Document Generator</option>
                      <option value="full-automation">Full Business Automation</option>
                      <option value="other">Other / Not Sure Yet</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Tell us about your business (optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="What problems are you looking to solve? What does your business do?"
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === "confirmation" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your discovery call has been scheduled for{" "}
                  <span className="font-medium text-foreground">
                    {formatSelectedDate()}
                  </span>{" "}
                  at{" "}
                  <span className="font-medium text-foreground">
                    {getSelectedTimeDisplay()}
                  </span>.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Check your email for a confirmation with meeting details.
                </p>
                <Button asChild variant="outline">
                  <a href="/">Return to Home</a>
                </Button>
              </div>
            )}
          </div>

          {/* Info Section */}
          {step !== "confirmation" && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2">15 min</div>
                <div className="text-sm text-muted-foreground">Quick discovery call</div>
              </div>
              <div>
                <div className="text-2xl mb-2">Free</div>
                <div className="text-sm text-muted-foreground">No obligation</div>
              </div>
              <div>
                <div className="text-2xl mb-2">48hr</div>
                <div className="text-sm text-muted-foreground">Follow-up proposal</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
