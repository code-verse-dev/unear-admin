import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, KeyRound, Users, Car, MapPin, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import unearLogo from "@/assets/unear-logo.png";

const featureIcons = [
  { icon: Users, label: "Users" },
  { icon: Car, label: "Vehicles" },
  { icon: MapPin, label: "Trips" },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    // Simulated API call
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
      toast({ title: "Reset Link Sent", description: `A password reset link has been sent to ${forgotEmail}.` });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/");
    }, 600);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'hsl(207 27% 11%)' }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[46%] relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, hsla(41,100%,59%,0.12) 0%, transparent 65%)' }} />
        <div className="absolute bottom-[-5%] right-[-10%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, hsla(41,100%,59%,0.08) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsla(0,0%,100%,0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 max-w-sm text-center">
          {/* Animated logo */}
          <div className="w-[88px] h-[88px] rounded-3xl overflow-hidden mx-auto mb-10 shadow-2xl animate-[pulse_3s_ease-in-out_infinite]" style={{ boxShadow: '0 0 0 4px hsla(41,100%,59%,0.15), 0 20px 60px -10px rgba(0,0,0,0.5)' }}>
            <img src={unearLogo} alt="UNear Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-[28px] font-extrabold tracking-tight font-display mb-2" style={{ color: 'hsl(41 100% 59%)' }}>
            UNear Admin
          </h2>
          <p className="text-[14px] leading-relaxed max-w-[280px] mx-auto" style={{ color: 'hsla(210,15%,75%,0.6)' }}>
            Manage your car-sharing platform with a powerful, intuitive dashboard.
          </p>

          <div className="mt-12 flex items-center justify-center gap-4">
            {featureIcons.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'hsla(41,100%,59%,0.1)' }}>
                  <Icon className="w-[18px] h-[18px]" style={{ color: 'hsl(41 100% 59%)' }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: 'hsla(210,15%,75%,0.4)' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center justify-center gap-8">
            {[
              { value: "12K+", label: "Users" },
              { value: "3.2K", label: "Vehicles" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold" style={{ color: 'hsl(41 100% 59%)' }}>{stat.value}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: 'hsla(210,15%,75%,0.35)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-card rounded-l-[2rem] lg:rounded-l-[2.5rem] relative" style={{ boxShadow: '-10px 0 40px -10px rgba(0,0,0,0.1)' }}>
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-border/40">
              <img src={unearLogo} alt="UNear Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[13px] font-semibold text-secondary tracking-wide mb-1">ADMIN PANEL</p>
            <h1 className="text-[26px] font-extrabold text-foreground tracking-tight font-display leading-tight">
              Welcome back 👋
            </h1>
            <p className="text-[14px] text-muted-foreground mt-2">
              Sign in to manage your platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground/35 group-focus-within:text-secondary transition-colors duration-200" />
                <Input
                  type="email"
                  placeholder="admin@unear.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-11 bg-muted/20 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/35 focus-visible:ring-2 focus-visible:ring-secondary/25 focus-visible:border-secondary/50 focus-visible:bg-card transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Password
              </Label>
              <div className="relative group">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-muted-foreground/35 group-focus-within:text-secondary transition-colors duration-200" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-11 pr-11 bg-muted/20 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/35 focus-visible:ring-2 focus-visible:ring-secondary/25 focus-visible:border-secondary/50 focus-visible:bg-card transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/35 hover:text-foreground transition-colors duration-150 p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setForgotEmail(email); setForgotSent(false); setForgotOpen(true); }}
                className="text-[12px] font-semibold text-secondary hover:text-secondary/70 transition-colors duration-150"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] font-bold rounded-xl transition-all duration-150 text-sm gap-2 disabled:opacity-70"
              style={{ boxShadow: '0 4px 20px -4px hsla(207,27%,11%,0.4)' }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <Lock className="w-3 h-3 text-muted-foreground/30" />
            <p className="text-[11px] text-muted-foreground/40 font-medium">
              Secured by <span className="font-bold text-foreground/50">UNear</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
