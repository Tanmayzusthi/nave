import { motion } from 'framer-motion';
import { Sparkles, Bot, Shield, Zap, Heart, Globe, Twitter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const AboutPage = () => {
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
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              Built for the future of thought.
            </h1>
            <p className="text-xl text-neutral-400 mb-12 leading-relaxed">
              Nave OS was born from a simple observation: our digital tools are scattered. 
              We chat in one app, take notes in another, and our "memory" of past ideas 
              is buried in a dozen different silos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Globe className="w-6 h-6 text-white" /> Our Mission
              </h2>
              <p className="text-neutral-400 leading-relaxed">
                To create a unified digital layer that enhances human intuition with 
                artificial intelligence. We believe technology should be silent, 
                elegant, and powerful.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-white" /> Privacy First
              </h2>
              <p className="text-neutral-400 leading-relaxed">
                Your data is your own. Nave OS uses end-to-end encryption and local 
                storage priorities to ensure your thoughts stay private.
              </p>
            </div>
          </div>

          <div className="p-12 rounded-3xl border border-white/5 bg-white/[0.02] text-center mb-20">
            <h2 className="text-3xl font-bold mb-6">Join the revolution.</h2>
            <p className="text-neutral-400 mb-8 max-w-lg mx-auto">
              Become a part of the Nave ecosystem and experience the next generation 
              of knowledge management.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Get Started for Free <Sparkles className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-neutral-500">
            <a href="#" className="hover:text-white transition-colors"><Github className="w-6 h-6" /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter className="w-6 h-6" /></a>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-white/5 text-center text-neutral-500 text-sm">
        <p>© 2024 Nave OS. Built with passion for knowledge workers.</p>
      </footer>
    </div>
  );
};

const Github = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default AboutPage;
