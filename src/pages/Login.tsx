import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import unearLogo from "@/assets/unear-logo.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient background shapes */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, hsl(var(--secondary)), transparent 70%)' }} />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }} />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Login Card */}
        <div
          className="bg-card rounded-2xl border border-border p-8 sm:p-10"
          style={{ boxShadow: '0 8px 60px -12px rgba(20, 28, 34, 0.15), 0 2px 8px -2px rgba(20, 28, 34, 0.06)' }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden shadow-sm border border-border/50">
              <img
                src={unearLogo}
                alt="UNear Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground tracking-tight font-display">
              Admin Panel Login
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1.5 font-medium">
              Sign in to manage your platform
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="admin@unear.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-muted/30 border-border/80 rounded-[10px] text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:border-secondary transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-muted/30 border-border/80 rounded-[10px] text-sm pr-11 placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:border-secondary transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors duration-150"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-[15px] h-[15px]" /> : <EyeOff className="w-[15px] h-[15px]" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-[12px] font-semibold text-secondary hover:text-secondary/70 transition-colors duration-150"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/85 active:scale-[0.98] font-bold rounded-[10px] transition-all duration-150 text-sm gap-2 shadow-md hover:shadow-lg"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <Lock className="w-3 h-3 text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground/60 font-medium">
              Secured by <span className="font-bold text-foreground/70">UNear</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
