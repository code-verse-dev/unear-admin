import { useState, useEffect } from "react";
import unearLogo from "@/assets/unear-logo.png";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 1800);
    const t3 = setTimeout(onComplete, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${phase === "exit" ? "opacity-0" : "opacity-100"}`}
      style={{ background: "hsl(20 10% 10%)" }}
    >
      {/* Ambient glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, hsla(25,40%,38%,0.12) 0%, transparent 60%)" }} />

      {/* Logo */}
      <div
        className={`relative w-24 h-24 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-out ${phase === "logo" ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        style={{ boxShadow: "0 0 0 4px hsla(25,40%,38%,0.2), 0 20px 60px -10px rgba(0,0,0,0.5)" }}
      >
        <img src={unearLogo} alt="UNear" className="w-full h-full object-cover" />
        <div
          className={`absolute inset-0 transition-transform duration-1000 delay-300 ${phase !== "logo" ? "translate-x-[200%]" : "-translate-x-full"}`}
          style={{ background: "linear-gradient(105deg, transparent 40%, hsla(25,40%,38%,0.3) 50%, transparent 60%)" }}
        />
      </div>

      {/* Brand name */}
      <div
        className={`mt-6 transition-all duration-500 delay-200 ${phase === "text" ? "opacity-100 translate-y-0" : phase === "exit" ? "opacity-0 -translate-y-2" : "opacity-0 translate-y-4"}`}
      >
        <h1 className="text-2xl font-extrabold tracking-tight font-display" style={{ color: "hsl(30 30% 96%)" }}>
          UNEAR
        </h1>
        <p className="text-center text-xs mt-1" style={{ color: "hsla(30,10%,70%,0.5)" }}>
          Admin Platform
        </p>
      </div>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{
              background: "hsl(25 40% 38%)",
              animationDelay: `${i * 200}ms`,
              opacity: phase === "exit" ? 0 : 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
