import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Bot, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">Nave OS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/app">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-neutral-400 mb-6 inline-block">
              Introducing Nave OS 1.0
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              Your AI Operating System.
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The unified workspace for chat, notes, memory, and productivity. 
              Built for the next generation of knowledge workers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/app">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Launch App <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <Bot className="w-4 h-4" /> View Docs
              </Button>
            </div>
          </motion.div>

          {/* Product Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-white/5">
              <img 
                src="/nave_os_mockup.png" 
                alt="Nave OS Dashboard" 
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 border-t border-white/5 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Bot className="w-6 h-6" />}
              title="Advanced AI Chat"
              description="Interact with the world's most capable models in a clean, focused environment."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Instant Memory"
              description="Nave remembers your context across sessions, making every interaction smarter."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="Secure Notes"
              description="Rich text editing with nested documents and encrypted storage."
            />
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-neutral-400 mb-12">Start for free, upgrade when you need more power.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <PricingCard 
              plan="Starter"
              price="₹0"
              features={["Unlimited Chats", "100MB Memory", "Standard Models", "5 Workspaces"]}
            />
            <PricingCard 
              plan="Pro"
              price="₹49"
              featured
              features={[
                'Extended 10GB Memory', 
                'Unlimited Notes Space', 
                'Nave Intelligence 2.5 Flash', 
                'Priority Processing', 
                'Custom AI Personas'
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-neutral-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-white">Nave OS</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
          <p>© 2024 Nave OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 text-white">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-neutral-400 leading-relaxed">{description}</p>
  </div>
);

const PricingCard = ({ plan, price, features, featured }) => (
  <div className={cn(
    "p-8 rounded-3xl border transition-all flex flex-col relative overflow-hidden group",
    featured ? "border-white/10 bg-white/[0.05]" : "border-white/5 bg-white/[0.02]"
  )}>
    {featured && (
      <div className="absolute top-0 right-0 p-3">
        <span className="text-[10px] font-bold bg-white text-black px-2 py-1 rounded-full uppercase tracking-tighter">Recommended</span>
      </div>
    )}
    <h3 className="text-xl font-bold mb-2">{plan}</h3>
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-4xl font-bold text-white">{price}</span>
      <span className="text-neutral-500 text-sm">/mo</span>
    </div>
    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feature) => (
        <li key={feature} className={cn("flex items-center gap-3 text-sm", featured ? "text-white font-medium" : "text-neutral-400")}>
          <div className={cn("w-1.5 h-1.5 rounded-full", featured ? "bg-white" : "bg-white/20")} />
          {feature}
        </li>
      ))}
    </ul>
    <Button variant={featured ? 'default' : 'outline'} className="w-full">
      {featured ? 'Upgrade Now' : 'Get Started'}
    </Button>
  </div>
);

export default LandingPage;
