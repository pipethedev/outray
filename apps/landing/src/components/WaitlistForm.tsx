import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("https://api.formdrop.co/f/c8hFwid7", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setEmail("");
        return;
      }

      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const disabled = status === "loading" || status === "success";

  return (
    <div className="pointer-events-auto w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center gap-3 w-full"
      >
        <input
          type="email"
          placeholder="Enter your email for early access"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={disabled}
          className="bg-white/5 border border-white/10 rounded-full px-6 py-4 w-full text-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50 backdrop-blur-sm"
          required
        />
        <button
          type="submit"
          disabled={disabled}
          className={`rounded-full p-4 transition-all duration-300 w-full sm:w-auto flex justify-center items-center ${
            status === "success"
              ? "bg-green-500 text-white"
              : status === "error"
                ? "bg-red-500 text-white"
                : "bg-white text-black hover:bg-gray-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === "loading" ? (
            <Loader2 className="animate-spin" size={24} />
          ) : status === "success" ? (
            <Check size={24} />
          ) : (
            <ArrowRight size={24} />
          )}
        </button>
      </form>
      {status === "success" && (
        <p className="mt-3 text-green-400 text-sm ml-6 animate-fade-in">
          You're on the list! We'll be in touch.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-red-400 text-sm ml-6 animate-fade-in">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
