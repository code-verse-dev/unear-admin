import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import UNearLogo from "@/components/UNearLogo";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - navigate to dashboard
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Decorative dots */}
      <div className="fixed top-8 right-12 grid grid-cols-5 gap-2 opacity-30">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-primary/30" />
        ))}
      </div>
      <div className="fixed bottom-12 left-8 grid grid-cols-4 gap-2 opacity-20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-primary/30" />
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="admin-card p-8">
          <div className="flex justify-center mb-6">
            <UNearLogo />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-1">
            Welcome to Admin Panel! 👋
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to manage your platform
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-card border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold h-11"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
