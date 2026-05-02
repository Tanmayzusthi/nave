import { User, Shield, CreditCard, Link as LinkIcon, Bell, Moon, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const SettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-8">
        {/* Account Section */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Account
          </h2>
          <Card className="p-6 border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-white/10 flex items-center justify-center text-2xl">
                  JD
                </div>
                <div>
                  <h3 className="font-semibold text-lg">John Doe</h3>
                  <p className="text-sm text-neutral-500">john@example.com</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-xs text-neutral-500">Full Name</label>
                <Input defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-500">Email Address</label>
                <Input defaultValue="john@example.com" />
              </div>
            </div>
          </Card>
        </section>

        {/* Plan & Billing */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Subscription
          </h2>
          <Card className="p-6 border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Nave OS Pro</h3>
                <p className="text-xs text-neutral-500">Your next billing date is Oct 12, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">₹49/mo</span>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </Card>
        </section>

        {/* API Connections */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Integrations
          </h2>
          <Card className="p-6 border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Github className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">GitHub</span>
              </div>
              <Button variant="ghost" size="sm" className="text-neutral-400">Connected</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Slack</span>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </Card>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Moon className="w-4 h-4" /> Appearance
          </h2>
          <Card className="p-6 border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-neutral-400" />
              <div>
                <h3 className="text-sm font-medium">Dark Mode</h3>
                <p className="text-xs text-neutral-500">Current theme is set to dark by default.</p>
              </div>
            </div>
            <div className="w-12 h-6 rounded-full bg-white/20 relative cursor-not-allowed">
              <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-lg" />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

const Github = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default SettingsPage;
