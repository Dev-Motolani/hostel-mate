"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Home, Mail, Lock, ArrowRight, User } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        const fieldErrors = Object.values(data).flat().join(" ");
        throw new Error(fieldErrors || "Unable to create your account.");
      }
      localStorage.setItem("hostel_mate_access_token", data.access);
      localStorage.setItem("hostel_mate_refresh_token", data.refresh);
      router.push("/onboarding");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create your account.");
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

      <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Create an account</h1>
                <p className="text-[var(--muted-foreground)] text-sm">Join Hostel Mate to find or list rooms</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                      <User className="h-5 w-5" />
                    </div>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all sm:text-sm" 
                      placeholder="John Doe"
                    />
                  </div>
                </div>

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
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                      className="block w-full pl-10 pr-3 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all sm:text-sm" 
                      placeholder="Create a strong password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all sm:text-sm" 
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
                <button disabled={isSubmitting} className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all disabled:cursor-not-allowed disabled:opacity-70">
                  {isSubmitting ? "Creating account…" : "Continue to Verification"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                
                <p className="text-xs text-center text-[var(--muted-foreground)] px-4">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
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
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
