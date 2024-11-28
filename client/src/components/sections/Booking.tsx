import * as React from "react";

export default function Booking() {
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Book a Consultation</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Schedule a consultation with our team to discuss how we can help transform your business with AI.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div 
            className="calendly-inline-widget" 
            data-url="https://calendly.com/ralvarez-y-w/better-system-ai-consultation"
            style={{minWidth: '320px', height: '700px'}}
          />
        </div>
      </div>
    </section>
  );
}
