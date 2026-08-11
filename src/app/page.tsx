"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Search, Home, ShieldCheck, CheckCircle2, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { PostRoomLink } from "@/components/post-room-link";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[var(--card)] border-b border-[var(--border)] shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="text-[var(--primary)] h-6 w-6" />
            <span className="font-bold text-xl tracking-tight text-[var(--primary)]">Hostel Mate</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/listings" className="text-base font-medium hover:text-[var(--primary)] transition-colors">Rooms</Link>
            <Link href="#explore" className="text-base font-medium hover:text-[var(--primary)] transition-colors">Explore</Link>
            <Link href="#about" className="text-base font-medium hover:text-[var(--primary)] transition-colors">About us</Link>
            <Link href="#contact" className="text-base font-medium hover:text-[var(--primary)] transition-colors">Contact</Link>
            <Link href="/login" className="text-base font-medium hover:text-[var(--primary)] transition-colors">Log in</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/signup" className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[var(--primary)]/90">
              Sign Up Free
            </Link>
            {/* Mobile Menu Toggle */}
            <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu" aria-expanded={menuOpen} className="md:hidden p-2 text-[var(--foreground)]">
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && <nav className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-4 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-semibold"><Link onClick={() => setMenuOpen(false)} href="/listings">Rooms</Link><Link onClick={() => setMenuOpen(false)} href="#explore">Explore</Link><Link onClick={() => setMenuOpen(false)} href="#about">About us</Link><Link onClick={() => setMenuOpen(false)} href="#contact">Contact</Link><Link onClick={() => setMenuOpen(false)} href="/login">Log in</Link><Link onClick={() => setMenuOpen(false)} href="/signup" className="rounded-lg bg-[var(--primary)] px-4 py-3 text-center text-white">Sign up free</Link></div></nav>}
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section (Centered with Background Image) */}
        <section className="relative min-h-[80vh] overflow-hidden px-4 pb-16 pt-20 sm:pb-20 sm:pt-24 md:pb-32 md:pt-32">
          {/* Background Image with Overlay (Removed) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[var(--primary)] opacity-5 rounded-[100%] blur-3xl pointer-events-none z-0" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto z-10 relative"
          >
            <div className="inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--primary)] mb-8 shadow-sm">
              <span className="mr-2">🎉</span> No more agent fees. By students, for students.
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl md:mb-8 md:text-7xl">
              Find your next off-campus <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-green-400">hostel</span> directly.
            </h1>
            <p className="mb-8 max-w-3xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg md:mb-12 md:text-2xl">
              Skip the agents and their steep fees. Connect directly with verified landlords and fellow students for vacant rooms around your university.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/listings" className="w-full sm:w-auto h-14 inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-10 text-lg font-bold text-white shadow-xl shadow-[var(--primary)]/20 transition-transform hover:scale-105">
                <Search className="mr-2 h-6 w-6" />
                Browse Rooms
              </Link>
              <PostRoomLink className="w-full sm:w-auto h-14 inline-flex items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--card)] px-10 text-xl font-bold text-[var(--foreground)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-lg">
                Post a Vacant Room
              </PostRoomLink>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-medium text-[var(--muted-foreground)]">
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-[var(--primary)]" /> Verified Landlords</div>
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-[var(--primary)]" /> Real Student Reviews</div>
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-[var(--primary)]" /> 100% Free to Browse</div>
            </div>
          </motion.div>
        </section>

        {/* Beautiful Rooms Gallery Section */}
        <section id="explore" className="py-24 bg-[var(--card)]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Discover beautiful rooms</h2>
                <p className="text-[var(--muted-foreground)] text-lg">Browse through high-quality, verified listings posted by students and landlords in your area.</p>
              </div>
              <Link href="/listings" className="group hidden md:flex items-center font-semibold text-[var(--primary)] hover:underline mt-4 md:mt-0">
                View all listings <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Image 1 */}
              <motion.div whileHover={{ y: -8 }} className="group overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background)] shadow-sm transition-all hover:shadow-xl">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1522771731478-44bf10448f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Modern room" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700">Verified</div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold line-clamp-1">Cozy En-suite Room</h3>
                    <span className="font-bold text-[var(--primary)]">₦150k<span className="text-xs text-[var(--muted-foreground)] font-normal">/yr</span></span>
                  </div>
                  <p className="text-[var(--muted-foreground)] flex items-center text-sm mb-4">
                    <MapPin className="mr-1 h-4 w-4" /> Oke-Odo, Tanke
                  </p>
                </div>
              </motion.div>

              {/* Image 2 */}
              <motion.div whileHover={{ y: -8 }} className="group rounded-3xl overflow-hidden bg-[var(--background)] border border-[var(--border)] shadow-sm hover:shadow-xl transition-all">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Minimalist room" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700">Verified</div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold line-clamp-1">Spacious Self-Contain</h3>
                    <span className="font-bold text-[var(--primary)]">₦220k<span className="text-xs text-[var(--muted-foreground)] font-normal">/yr</span></span>
                  </div>
                  <p className="text-[var(--muted-foreground)] flex items-center text-sm mb-4">
                    <MapPin className="mr-1 h-4 w-4" /> Near Mark Fuel Station
                  </p>
                </div>
              </motion.div>

              {/* Image 3 */}
              <motion.div whileHover={{ y: -8 }} className="group rounded-3xl overflow-hidden bg-[var(--background)] border border-[var(--border)] shadow-sm hover:shadow-xl transition-all md:hidden lg:block">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1598928506311-c55dd580e5b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Shared room" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700">Verified</div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold line-clamp-1">Premium Shared Flat</h3>
                    <span className="font-bold text-[var(--primary)]">₦180k<span className="text-xs text-[var(--muted-foreground)] font-normal">/yr</span></span>
                  </div>
                  <p className="text-[var(--muted-foreground)] flex items-center text-sm mb-4">
                    <MapPin className="mr-1 h-4 w-4" /> Tipper Garage, University Road
                  </p>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-8 text-center md:hidden">
              <Link href="/listings" className="inline-flex items-center font-semibold text-[var(--primary)] hover:underline">
                View all listings <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="about" className="bg-[var(--secondary)]/20 py-24 border-t border-[var(--border)]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How Hostel Mate Works</h2>
              <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">A simple, transparent way to find housing without the middleman markup.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div whileHover={{ y: -5 }} className="bg-[var(--card)] p-8 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="h-14 w-14 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6 text-[var(--primary)] relative z-10">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">1. Search Rooms</h3>
                <p className="text-[var(--muted-foreground)] relative z-10">Browse verified listings posted by other students who know about vacant rooms in your area.</p>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }} className="bg-[var(--card)] p-8 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="h-14 w-14 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6 text-[var(--primary)] relative z-10">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">2. Unlock Contact</h3>
                <p className="text-[var(--muted-foreground)] relative z-10">Get the landlord's direct phone number securely. Accounts are ID-verified for your safety.</p>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }} className="bg-[var(--card)] p-8 rounded-2xl shadow-sm border border-[var(--border)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="h-14 w-14 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6 text-[var(--primary)] relative z-10">
                  <Home className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">3. Move In</h3>
                <p className="text-[var(--muted-foreground)] relative z-10">Call the landlord directly, inspect the room, pay your rent, and move in. Zero agent fees!</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t border-[var(--border)] py-12 bg-[var(--card)] mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Home className="text-[var(--primary)] h-6 w-6" />
            <span className="font-bold text-xl text-[var(--foreground)] tracking-tight">Hostel Mate</span>
          </div>
          <div className="flex gap-6 mb-4 md:mb-0 text-sm font-medium text-[var(--muted-foreground)]">
            <Link href="/about" className="hover:text-[var(--primary)] transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Hostel Mate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
