"use client";

import Link from "next/link";
import { MapPin, Search, Home, ShieldCheck, CheckCircle2, Menu, X, Video, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PostRoomLink } from "@/components/post-room-link";
import { VideoPlayer } from "@/components/video-player";
import { LogoutButton } from "@/components/logout-button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url: string) => url.startsWith("http") ? url : `${apiOrigin}${url}`;

type Listing = {
  id: number;
  title: string;
  location: string;
  rent_amount: string;
  rent_duration_label: string;
  facilities: string[];
  owner_name: string;
  owner_department: string;
  owner_level: string;
  images: { image: string }[];
  videos: { id: number; video: string }[];
  verification_status: string;
  is_hostelmate_verified: boolean;
};

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("hostel_mate_access_token"));
    fetch(`${apiUrl}/listings/?available=true&verified=true`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load rooms");
        return response.json();
      })
      .then((data) => {
        const fetchedListings = Array.isArray(data) ? data : data.results ?? [];
        setListings(fetchedListings);
      })
      .catch(() => setListings([]))
      .finally(() => setIsLoading(false));
  }, []);

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
            <Link href="#explore" className="text-base font-medium hover:text-[var(--primary)] transition-colors">Explore</Link>
            <Link href="#about" className="text-base font-medium hover:text-[var(--primary)] transition-colors">About us</Link>
            <Link href="#contact" className="text-base font-medium hover:text-[var(--primary)] transition-colors">Contact</Link>
            {!isLoggedIn ? (
              <Link href="/login" className="text-base font-medium hover:text-[var(--primary)] transition-colors">Log in</Link>
            ) : (
              <Link href="/account" className="text-base font-medium hover:text-[var(--primary)] transition-colors">My Account</Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <Link href="/signup" className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[var(--primary)]/90">
                Sign Up Free
              </Link>
            ) : (
              <LogoutButton className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200" />
            )}
            {/* Mobile Menu Toggle */}
            <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu" aria-expanded={menuOpen} className="md:hidden p-2 text-[var(--foreground)]">
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-4 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-semibold">
              <Link onClick={() => setMenuOpen(false)} href="#explore">Explore</Link>
              <Link onClick={() => setMenuOpen(false)} href="#about">About us</Link>
              <Link onClick={() => setMenuOpen(false)} href="#contact">Contact</Link>
              {!isLoggedIn ? (
                <>
                  <Link onClick={() => setMenuOpen(false)} href="/login">Log in</Link>
                  <Link onClick={() => setMenuOpen(false)} href="/signup" className="rounded-lg bg-[var(--primary)] px-4 py-3 text-center text-white">Sign up free</Link>
                </>
              ) : (
                <>
                  <Link onClick={() => setMenuOpen(false)} href="/account">My Account</Link>
                  <LogoutButton className="text-red-600 font-bold" />
                </>
              )}
            </div>
          </nav>
        )}
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
              <Link href="/login" className="w-full sm:w-auto h-14 inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-10 text-lg font-bold text-white shadow-xl shadow-[var(--primary)]/20 transition-transform hover:scale-105">
                <LogIn className="mr-2 h-6 w-6" />
                Sign in to browse rooms
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

        {/* Real listing videos */}
        <section id="explore" className="py-24 bg-[var(--card)]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Rooms</h2>
                <p className="text-[var(--muted-foreground)] text-lg">Browse verified rooms from real students and landlords. Sign in to view details and request an inspection.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background)]"><div className="aspect-[0.9] bg-[var(--muted)]" /><div className="space-y-3 p-6"><div className="h-6 w-3/4 rounded bg-[var(--muted)]" /><div className="h-4 w-1/2 rounded bg-[var(--muted)]" /></div></div>)}
              {listings.map((listing) => {
                const isSaved = saved.includes(listing.id);
                const image = listing.images?.[0]?.image;
                const video = listing.videos?.[0]?.video;
                const posterDetails = [listing.owner_department, listing.owner_level].filter(Boolean).join(" · ");

                return (
                  <article key={listing.id} className="group overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
                    <div className="relative aspect-[0.9] overflow-hidden">
                      {image ? (
                        <img src={mediaUrl(image)} alt={listing.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : video ? (
                        <VideoPlayer src={mediaUrl(video)} muted className="h-full w-full" />
                      ) : (
                        <div className="grid h-full place-items-center bg-slate-100 text-center text-sm font-semibold text-slate-500">No media uploaded</div>
                      )}

                      <button
                        onClick={() => setSaved((current) => (isSaved ? current.filter((item) => item !== listing.id) : [...current, listing.id]))}
                        aria-label="Save listing"
                        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 shadow-sm"
                      >
                        <svg className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </button>

                      {listing.is_hostelmate_verified && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#15803d] px-2.5 py-1 text-[11px] font-extrabold text-white">
                          <ShieldCheck className="h-3 w-3" /> HostelMate Verified
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="flex items-center gap-1 text-sm font-semibold text-slate-500">
                        <MapPin className="h-4 w-4 text-[#15803d]" /> {listing.location}
                      </p>
                      <Link href={`/listings/${listing.id}`} prefetch className="mt-2 block text-xl font-extrabold tracking-tight hover:text-[#15803d] text-slate-900">
                        {listing.title}
                      </Link>
                      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                        <p className="font-bold text-slate-800">{listing.owner_name || "Poster name unavailable"}</p>
                        <p className="mt-1 text-slate-500">{posterDetails || "Department and level unavailable"}</p>
                      </div>
                      <p className="mt-4 text-lg font-black text-slate-900">₦{Number(listing.rent_amount).toLocaleString()}</p>
                    </div>
                  </article>
                );
              })}
              {!isLoading && listings.length === 0 && <div className="col-span-full rounded-3xl border border-[var(--border)] bg-[var(--background)] px-6 py-14 text-center text-[var(--muted-foreground)]"><Video className="mx-auto h-8 w-8" /><p className="mt-3 font-semibold">No verified rooms have been posted yet.</p></div>}
            </div>
          </div>
        </section>

        <section id="contact" className="border-t border-[var(--border)] bg-[var(--background)] py-24">
          <div className="container mx-auto max-w-3xl px-4 text-center"><h2 className="text-3xl font-bold">Contact room posters safely</h2><p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted-foreground)]">Sign in to browse room listings and access the contact details the poster provided for each room.</p><Link href="/login" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-7 font-bold text-white transition hover:bg-[var(--primary)]/90">Sign in</Link></div>
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
                <h3 className="text-xl font-bold mb-3 relative z-10">2. Contact the poster</h3>
                <p className="text-[var(--muted-foreground)] relative z-10">Sign in to see the poster&apos;s number, inspect the room, and complete rent through Hostel Mate.</p>
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
      <footer className="border-t border-[var(--border)] py-12 bg-[var(--card)] mt-auto">
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
