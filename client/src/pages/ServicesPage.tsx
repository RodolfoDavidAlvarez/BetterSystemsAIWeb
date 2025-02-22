
export default function ServicesPage() {
  const services = [
    {
      title: "Business AI Consulting",
      subtitle: "Strategic AI implementation guidance",
      description: "Get expert guidance on integrating AI into your business operations. Our consultants help identify opportunities, develop implementation strategies, and ensure successful AI adoption across your organization.",
      benefits: [
        "AI readiness assessment",
        "Strategic implementation planning",
        "Technology stack recommendations",
        "ROI analysis and projections",
        "Change management support",
        "Training and enablement"
      ],
      integrations: [
        { icon: BrainCircuit, label: "Strategy" },
        { icon: LineChart, label: "Analytics" },
        { icon: Users, label: "Training" },
        { icon: Cog, label: "Implementation" },
        { icon: BadgeCheck, label: "Compliance" }
      ],
      href: "/services/ai-consulting",
      highlight: "Transform your business with expert AI guidance"
    },
    {
      title: "Process Automation",
      subtitle: "Streamline your operations",
      description: "Automate repetitive tasks and workflows with AI-powered solutions. Our automation services help reduce manual effort, minimize errors, and increase operational efficiency.",
      benefits: [
        "Workflow analysis and optimization",
        "Custom automation solutions",
        "Integration with existing systems",
        "Performance monitoring",
        "Scalable architecture",
        "24/7 automated operations"
      ],
      integrations: [
        { icon: Workflow, label: "Workflows" },
        { icon: Bot, label: "Automation" },
        { icon: Database, label: "Integration" },
        { icon: Activity, label: "Monitoring" }
      ],
      href: "/services/process-automation",
      highlight: "Boost efficiency with intelligent automation"
    },
    {
      title: "AI Assistants",
      subtitle: "Intelligent virtual workforce",
      description: "Deploy AI assistants that handle customer service, data processing, and internal operations. Our virtual assistants work 24/7 to support your team and improve customer satisfaction.",
      benefits: [
        "Custom AI assistant development",
        "Natural language processing",
        "Multi-channel integration",
        "Continuous learning capabilities",
        "Analytics and reporting",
        "Seamless scalability"
      ],
      integrations: [
        { icon: MessageSquare, label: "Chat" },
        { icon: Brain, label: "AI" },
        { icon: BarChart, label: "Analytics" },
        { icon: Share2, label: "Integration" }
      ],
      href: "/services/ai-assistants",
      highlight: "Enhanced support with AI assistants"
    },
    {
      title: "Data Analytics & Insights",
      subtitle: "Transform data into decisions",
      description: "Unlock the power of your data with advanced analytics and AI-driven insights. We help you collect, analyze, and visualize data to make informed business decisions.",
      benefits: [
        "Data strategy development",
        "Advanced analytics implementation",
        "Predictive modeling",
        "Real-time dashboards",
        "Custom reporting solutions",
        "Data-driven recommendations"
      ],
      integrations: [
        { icon: Database, label: "Data" },
        { icon: LineChart, label: "Analytics" },
        { icon: PieChart, label: "Visualization" },
        { icon: Lightbulb, label: "Insights" }
      ],
      href: "/services/data-analytics",
      highlight: "Data-driven decision making"
    },
    {
      title: "AI Security & Compliance",
      subtitle: "Secure AI implementation",
      description: "Ensure your AI systems are secure, compliant, and ethically sound. Our security services help protect your AI investments while maintaining regulatory compliance.",
      benefits: [
        "Security assessment",
        "Compliance monitoring",
        "Ethical AI guidelines",
        "Risk management",
        "Regular security audits",
        "Incident response planning"
      ],
      integrations: [
        { icon: Shield, label: "Security" },
        { icon: Lock, label: "Protection" },
        { icon: FileCheck, label: "Compliance" },
        { icon: AlertTriangle, label: "Risk" }
      ],
      href: "/services/ai-security",
      highlight: "Secure and compliant AI systems"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Our Services</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive AI solutions to transform your business operations and drive growth
        </p>
      </div>

      <div className="grid gap-12">
        {services.map((service, index) => (
          <div key={index} className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">{service.title}</h2>
                <p className="text-xl text-muted-foreground">{service.subtitle}</p>
              </div>
              <p className="text-lg">{service.description}</p>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Key Benefits</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {service.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-1" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-4">
                {service.integrations.map((integration, i) => (
                  <div key={i} className="text-center">
                    <integration.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <span className="text-sm">{integration.label}</span>
                  </div>
                ))}
              </div>
              <Button asChild size="lg">
                <Link href={service.href}>Learn More</Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center">
                <service.integrations[0].icon className="h-32 w-32 text-primary/20" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
