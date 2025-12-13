import { useEffect, useState } from "react";

export function Terminal() {
  const [text, setText] = useState("");
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const command = "outray 6967";
    if (step === 0) {
      if (text.length < command.length) {
        const timeout = setTimeout(() => {
          setText(command.slice(0, text.length + 1));
        }, 80);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => setStep(1), 300);
      return () => clearTimeout(timeout);
    }
  }, [text, step]);

  useEffect(() => {
    if (step === 1) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 150);

      const timeout = setTimeout(() => {
        setStep(2);
      }, 1500);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      const timeout = setTimeout(() => setStep(3), 600);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  return (
    <div className="w-full lg:w-120 bg-black/50 rounded-lg border border-white/10 backdrop-blur-md p-4 md:p-8 font-mono text-sm md:text-base text-gray-300 pointer-events-auto min-h-50 md:min-h-60">
      <div className="space-y-2">
        <p>
          <span className="text-green-400">➜</span>{" "}
          <span className="text-blue-400">~</span> {text}
          {step === 0 && (
            <span className="animate-pulse text-green-400">_</span>
          )}
        </p>

        {step >= 1 && (
          <p className="text-cyan-400">
            ✨ Connecting to OutRay{step === 1 ? dots : "..."}
          </p>
        )}

        {step >= 2 && (
          <p className="text-green-400">🔌 Linked to your local port 6967</p>
        )}

        {step >= 3 && (
          <div className="space-y-2">
            <p className="text-fuchsia-400">
              🌐 Tunnel ready: https://tunnel.outray.dev
            </p>
            <p className="text-yellow-400">
              🥹 Don't close this or I'll cry softly.
            </p>
          </div>
        )}

        {step === 3 && <p className="animate-pulse text-green-400">_</p>}
      </div>
    </div>
  );
}
