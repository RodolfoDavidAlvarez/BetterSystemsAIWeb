import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brush, 
  Clock, 
  Code, 
  Cog, 
  Command, 
  Database, 
  Globe, 
  LayoutGrid, 
  Lightbulb,
  MessageSquareText, 
  Share2, 
  Sparkles, 
  Upload
} from "lucide-react";

export default function BuildWebsiteWithAIPage() {
  return (
    <div className="container mx-auto py-16 px-4 md:py-24">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="space-y-8 text-center">
          <div className="inline-block p-2 bg-primary/10 rounded-full text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Build Your Website with AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn how to leverage AI tools to design, develop, and deploy modern websites without extensive coding knowledge.
          </p>
        </div>

        {/* Overview Section */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Why Build with AI?</h2>
              <p className="text-muted-foreground">
                Modern AI tools have transformed web development, making it accessible to everyone. 
                With the right approach, you can create professional websites faster than ever.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Clock className="h-6 w-6 text-primary shrink-0" />
                  <span>Reduce development time by up to 80%</span>
                </li>
                <li className="flex gap-3">
                  <Code className="h-6 w-6 text-primary shrink-0" />
                  <span>Generate functional code without programming experience</span>
                </li>
                <li className="flex gap-3">
                  <Lightbulb className="h-6 w-6 text-primary shrink-0" />
                  <span>Get smart design recommendations based on your industry</span>
                </li>
                <li className="flex gap-3">
                  <Share2 className="h-6 w-6 text-primary shrink-0" />
                  <span>Collaborate seamlessly with AI assistants</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Globe className="h-16 w-16 text-primary mx-auto" />
                <p className="text-xl font-medium">Your AI-powered website</p>
                <p className="text-sm text-muted-foreground">
                  From concept to launch in days, not months
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">The AI Website Building Process</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A structured approach to creating websites with AI tools
            </p>
          </div>

          <Tabs defaultValue="plan" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              <TabsTrigger value="plan">1. Plan</TabsTrigger>
              <TabsTrigger value="design">2. Design</TabsTrigger>
              <TabsTrigger value="develop">3. Develop</TabsTrigger>
              <TabsTrigger value="deploy">4. Deploy</TabsTrigger>
            </TabsList>
            <TabsContent value="plan" className="p-6 border rounded-md mt-4">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Planning Your Website</h3>
                <p className="text-muted-foreground">
                  Start by clearly defining your website's purpose and gathering requirements.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <MessageSquareText className="h-5 w-5 text-primary shrink-0" />
                    <span>Use AI to generate website requirements based on your business</span>
                  </li>
                  <li className="flex gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary shrink-0" />
                    <span>Create a sitemap with AI assistance</span>
                  </li>
                  <li className="flex gap-2">
                    <Command className="h-5 w-5 text-primary shrink-0" />
                    <span>Define user flows and essential features</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="design" className="p-6 border rounded-md mt-4">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Designing the User Interface</h3>
                <p className="text-muted-foreground">
                  Generate design concepts and UI components with AI tools.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <Brush className="h-5 w-5 text-primary shrink-0" />
                    <span>Create wireframes using AI design tools</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <span>Generate color schemes and typography that match your brand</span>
                  </li>
                  <li className="flex gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary shrink-0" />
                    <span>Design responsive layouts for all device sizes</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="develop" className="p-6 border rounded-md mt-4">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Developing Functionality</h3>
                <p className="text-muted-foreground">
                  Bring your design to life with code generation and AI development.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <Code className="h-5 w-5 text-primary shrink-0" />
                    <span>Generate HTML, CSS, and JavaScript for your designs</span>
                  </li>
                  <li className="flex gap-2">
                    <Database className="h-5 w-5 text-primary shrink-0" />
                    <span>Create backend functionality with AI assistants</span>
                  </li>
                  <li className="flex gap-2">
                    <Cog className="h-5 w-5 text-primary shrink-0" />
                    <span>Implement interactive features and forms</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="deploy" className="p-6 border rounded-md mt-4">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Deploying Your Website</h3>
                <p className="text-muted-foreground">
                  Publish your website and make it accessible to the world.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <Upload className="h-5 w-5 text-primary shrink-0" />
                    <span>Choose a hosting platform with AI guidance</span>
                  </li>
                  <li className="flex gap-2">
                    <Globe className="h-5 w-5 text-primary shrink-0" />
                    <span>Set up your domain and deploy your site</span>
                  </li>
                  <li className="flex gap-2">
                    <Cog className="h-5 w-5 text-primary shrink-0" />
                    <span>Configure analytics and monitoring</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Tools Section */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Recommended AI Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful AI solutions to help you build your website
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Design Assistants</CardTitle>
                <CardDescription>Generate designs based on your requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>Midjourney for visual concepts</li>
                  <li>DALL-E for custom graphics</li>
                  <li>Designify for UI components</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Code Generation</CardTitle>
                <CardDescription>Transform designs into functional code</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>GitHub Copilot for developers</li>
                  <li>ChatGPT for code snippets</li>
                  <li>Replit for collaborative coding</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Content Creation</CardTitle>
                <CardDescription>Create engaging website content</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>ChatGPT for writing copy</li>
                  <li>Jasper for marketing content</li>
                  <li>Copy.ai for specialized text</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/5 rounded-xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Build Your Website?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We can help you navigate the AI website development process and create a stunning online presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="w-full sm:w-auto">
              Book a Consultation
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View Our Services
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}