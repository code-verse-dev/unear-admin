import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 p-4 relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10" style={{ boxShadow: '0 4px 40px -8px rgba(20, 28, 34, 0.12), 0 1px 4px -1px rgba(20, 28, 34, 0.06)' }}>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={unearLogo}
              alt="UNear Logo"
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground tracking-tight font-display">
              Admin Panel Login
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to manage your platform
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-muted/40 border-border rounded-[10px] text-sm placeholder:text-muted-foreground/60 focus-visible:ring-secondary focus-visible:border-secondary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-muted/40 border-border rounded-[10px] text-sm pr-11 placeholder:text-muted-foreground/60 focus-visible:ring-secondary focus-visible:border-secondary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 font-semibold rounded-[10px] transition-all text-sm gap-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Secured by <span className="font-semibold text-foreground">UNear</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
