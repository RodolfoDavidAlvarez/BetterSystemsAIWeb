import { motion } from 'framer-motion';
import { fadeIn, staggerChildren } from '@/lib/animations';
import { BrainCircuit, LineChart, Users } from 'lucide-react'; // Ensure correct imports

export default function AIConsultingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-4xl mx-auto mb-16"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <h1 className="text-5xl font-bold mb-4">AI Consulting & Future-Proofing</h1>
        <h2 className="text-2xl font-semibold mb-2">Stay Ahead with AI-Driven Innovation</h2>
        <p className="text-xl text-muted-foreground mb-12">
          Future-Proof Your Business with Cutting-Edge AI Strategies
          AI is evolving fast—will your business keep up? Our AI Consulting & Future-Proofing service ensures you stay ahead of the curve with continuous guidance, industry insights, and proactive AI strategies tailored to your business needs.
        </p>
        <ul className="list-disc pl-5 mb-12">
          <li>🔹 Predict & Adapt to AI Trends</li>
          <li>🔹 Optimize Business Operations with AI</li>
          <li>🔹 Gain a Competitive Edge in Your Industry</li>
        </ul>
        <h3 className="text-lg font-semibold mb-2">Why Choose AI Consulting & Future-Proofing?</h3>
        <ul className="list-disc pl-5 mb-12">
          <li>💪 Ongoing AI Guidance – Get continuous access to AI experts who analyze trends and recommend strategic improvements.</li>
          <li>💪 Proactive AI Updates – Be the first to know about new AI tools, breakthroughs, and automation advancements relevant to your industry.</li>
          <li>💪 Customized AI Strategies – Tailored AI roadmaps designed to enhance your operations, efficiency, and scalability.</li>
          <li>💪 Long-Term Competitive Advantage – AI isn’t just about keeping up—it’s about leading. Stay ahead with future-proof AI implementation.</li>
        </ul>
        <h3 className="text-lg font-semibold mb-2">What’s Included?</h3>
        <ul className="list-disc pl-5 mb-12">
          <li>📌 AI Strategy Assessment – We evaluate your current AI adoption and identify opportunities for improvement.</li>
          <li>📌 Quarterly Optimization Reviews – Regular evaluations of your AI solutions to ensure maximum efficiency.</li>
          <li>📌 Industry Trends & Alerts – Curated reports on the latest AI advancements and how they impact your business.</li>
          <li>📌 Exclusive AI Consultation – Priority access to expert strategists for personalized AI advice.</li>
          <li>📌 Implementation Roadmap – Step-by-step guidance on integrating AI into your workflow for sustainable growth.</li>
        </ul>
        <h3 className="text-lg font-semibold mb-2">Who Is This For?</h3>
        <ul className="list-disc pl-5 mb-12">
          <li>🚀 Business leaders looking to leverage AI for operational efficiency.</li>
          <li>🚀 Companies that want to stay competitive in an AI-driven market.</li>
          <li>🚀 Organizations in need of custom AI strategies without the guesswork.</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-4">Transform Your Business with AI Expertise</h2>
        <p className="text-xl text-muted-foreground mb-12">
          AI is reshaping the business world—don’t get left behind. With Better Systems AI, you have a dedicated AI partner that ensures your business is always a step ahead.
        </p>
        <h3 className="text-lg font-semibold mb-2">🎯 Book Your Free AI Strategy Session Today!</h3>
        <p className="text-lg">📩 Schedule a Consultation | 📞 Call Us: (Your Contact Info)</p>
      </motion.div>
    </div>
  );
}