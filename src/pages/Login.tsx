import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import unearLogo from "@/assets/unear-logo.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/");
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, hsl(var(--secondary)) 0%, transparent 50%),
                           radial-gradient(circle at 70% 80%, hsl(var(--secondary)) 0%, transparent 40%)`,
        }} />
        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-8 ring-4 ring-secondary/20 shadow-2xl">
            <img src={unearLogo} alt="UNear Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-3xl font-extrabold text-primary-foreground font-display tracking-tight mb-3">
            UNear Admin
          </h2>
          <p className="text-sm text-primary-foreground/50 leading-relaxed max-w-xs mx-auto">
            Manage your car-sharing platform with a powerful, intuitive admin dashboard.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            {["Users", "Vehicles", "Trips"].map((item) => (
              <div key={item} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <span className="text-secondary text-xs font-bold">{item[0]}</span>
                </div>
                <span className="text-[10px] text-primary-foreground/40 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo - shown only on smaller screens */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-border/50">
              <img src={unearLogo} alt="UNear Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-display">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to your admin account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input
                  type="email"
                  placeholder="admin@unear.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10 bg-muted/25 border-border/60 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary/60 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-11 bg-muted/25 border-border/60 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary/60 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors duration-150 p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                className="text-[12px] font-semibold text-secondary hover:text-secondary/70 transition-colors duration-150"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/85 active:scale-[0.98] font-bold rounded-xl transition-all duration-150 text-sm gap-2 shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/25 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <Lock className="w-3 h-3 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground/50 font-medium">
              Secured by <span className="font-bold text-foreground/60">UNear</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
