import { useState, useMemo, useEffect } from "react";
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

// Generate all possible time slots
function getAllTimeSlots(): { time: string; display: string }[] {
  const slots: { time: string; display: string }[] = [];

  // Morning slots (9 AM - 12 PM)
  for (let hour = 9; hour < 12; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      const display = `${displayHour}:${min.toString().padStart(2, "0")} ${ampm}`;
      slots.push({ time, display });
    }
  }

  // Afternoon slots (1 PM - 4:30 PM)
  for (let hour = 13; hour <= 16; hour++) {
    const maxMin = hour === 16 ? 30 : 60; // Stop at 4:30 PM
    for (let min = 0; min < maxMin; min += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = "PM";
      const display = `${displayHour}:${min.toString().padStart(2, "0")} ${ampm}`;
      slots.push({ time, display });
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
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
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

  // Disable Sundays and dates before minDate
  const disabledDays = useMemo(() => {
    return [
      { before: minDate },
      { after: maxDate },
      { dayOfWeek: [0] }, // Sunday only
    ];
  }, [minDate, maxDate]);

  // Fetch booked slots when date is selected
  useEffect(() => {
    if (!selectedDate) return;

    const fetchBookedSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const response = await fetch(`/api/bookings/slots/${dateStr}`);
        const data = await response.json();
        if (data.success) {
          setBookedTimes(data.bookedTimes || []);
        }
      } catch (error) {
        console.error("Failed to fetch booked slots:", error);
        setBookedTimes([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate]);

  // Generate time slots with availability based on booked times
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];
    const allSlots = getAllTimeSlots();
    return allSlots.map(slot => ({
      ...slot,
      available: !bookedTimes.includes(slot.time),
    }));
  }, [selectedDate, bookedTimes]);

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

      <section className="min-h-screen pt-8 pb-16 md:pt-16 md:pb-24 bg-background relative z-0">
        <div className="container mx-auto px-4 max-w-xl md:max-w-4xl">
          {/* Header - Compact on mobile */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
              Book a Discovery Call
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
              Schedule a free 15-minute call to explore how we can help you save time and scale.
            </p>
          </div>

          {/* Personal Introduction - Simplified for mobile */}
          <div className="flex items-center gap-4 bg-card rounded-xl p-4 md:p-6 shadow-sm border mb-6 md:mb-10">
            <img
              src="/Professional Headshot Rodolfo compressed.jpg"
              alt="Rodo Alvarez"
              className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
            />
            <div>
              <p className="font-medium text-sm md:text-lg mb-1">Looking forward to meeting you!</p>
              <p className="text-muted-foreground text-xs md:text-sm leading-snug">
                I'm Rodo, founder of Better Systems AI. Let's talk about your business and find automation opportunities.
              </p>
            </div>
          </div>

          {/* Progress Steps - Clean mobile design */}
          <div className="flex justify-center mb-4 md:mb-8">
            <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <div className={`flex items-center gap-1 ${step === "date" ? "text-primary font-medium" : step === "time" || step === "details" || step === "confirmation" ? "text-green-500" : "text-muted-foreground"}`}>
                <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Date</span>
              </div>
              <span className="text-muted-foreground/50">→</span>
              <div className={`flex items-center gap-1 ${step === "time" ? "text-primary font-medium" : step === "details" || step === "confirmation" ? "text-green-500" : "text-muted-foreground"}`}>
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Time</span>
              </div>
              <span className="text-muted-foreground/50">→</span>
              <div className={`flex items-center gap-1 ${step === "details" ? "text-primary font-medium" : step === "confirmation" ? "text-green-500" : "text-muted-foreground"}`}>
                <span>Details</span>
              </div>
              <span className="text-muted-foreground/50">→</span>
              <div className={`flex items-center gap-1 ${step === "confirmation" ? "text-green-500 font-medium" : "text-muted-foreground"}`}>
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Done</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-card rounded-xl border shadow-sm p-4 md:p-8">
            {/* Step 1: Date Selection */}
            {step === "date" && (
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4">Select a Date</h2>
                <p className="text-sm text-muted-foreground mb-8 text-center">
                  Earliest availability is 3 days from today.<br />
                  Sundays are not available.
                </p>
                <div className="bg-background rounded-xl border shadow-sm p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={disabledDays}
                    className="mx-auto"
                    fromDate={minDate}
                    toDate={maxDate}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center h-10",
                      caption_label: "text-base font-semibold",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem] text-center",
                      row: "flex w-full mt-1",
                      cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground font-semibold",
                      day_outside: "day-outside text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-30",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
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

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`py-3 px-3 rounded-lg border text-sm font-medium transition-all active:scale-95 ${
                        slot.available
                          ? "hover:border-primary hover:bg-primary/5 cursor-pointer"
                          : "opacity-30 cursor-not-allowed line-through bg-muted/30"
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Smith"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@company.com"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-sm">Company Name</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Corp"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="interest" className="text-sm">What are you interested in?</Label>
                    <select
                      id="interest"
                      name="interest"
                      value={formData.interest}
                      onChange={handleInputChange}
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm">Tell us about your business (optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="What problems are you looking to solve?"
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={isSubmitting}>
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
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
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

          {/* Info Section - Compact on mobile */}
          {step !== "confirmation" && (
            <div className="mt-6 md:mt-10 flex flex-wrap justify-center gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 bg-card border rounded-full px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="font-medium">15 min</span>
              </div>
              <div className="flex items-center gap-1.5 bg-card border rounded-full px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="font-medium">Free</span>
              </div>
              <div className="flex items-center gap-1.5 bg-card border rounded-full px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm">
                <CalendarDays className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="font-medium">48hr follow-up</span>
              </div>
            </div>
          )}

          {/* Timezone note */}
          {step !== "confirmation" && (
            <p className="text-center text-[10px] md:text-xs text-muted-foreground mt-4 md:mt-6">
              Times shown in Phoenix, AZ (MST)
            </p>
          )}
        </div>
      </section>
    </>
  );
}
