"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Home, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Unable to sign in. Check your details and try again.");
      localStorage.setItem("hostel_mate_access_token", data.access);
      localStorage.setItem("hostel_mate_refresh_token", data.refresh);
      router.push("/listings");
    } catch (requestError) {
      if (requestError instanceof TypeError && requestError.message === "Failed to fetch") {
        setError("We cannot reach the Hostel Mate server. Please start the Django backend and try again.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Unable to sign in right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--secondary)]/30 to-[var(--background)]">
      {/* Minimal Header */}
      <header className="absolute top-0 w-full z-50">
        <div className="container mx-auto px-4 h-24 flex items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-[var(--primary)] p-2 rounded-xl">
              <Home className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-[var(--foreground)]">Hostel Mate</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                <p className="text-[var(--muted-foreground)] text-sm">Enter your details to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all sm:text-sm" 
                      placeholder="you@university.edu"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-[var(--foreground)]">Password</label>
                    <Link href="#" className="text-xs font-semibold text-[var(--primary)] hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input 
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="block w-full pl-10 pr-12 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all sm:text-sm" 
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} title={passwordVisible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-1 z-10 flex items-center rounded px-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">{passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                  </div>
                </div>

                {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
                <button disabled={isSubmitting} className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all disabled:cursor-not-allowed disabled:opacity-70">
                  {isSubmitting ? "Signing in…" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </form>
              
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--card)] text-[var(--muted-foreground)]">or</span>
                </div>
              </div>

              <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
                Don't have an account yet?{' '}
                <Link href="/signup" className="font-bold text-[var(--primary)] hover:underline">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
