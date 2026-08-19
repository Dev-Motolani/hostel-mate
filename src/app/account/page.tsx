"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, MapPin, ShieldAlert, ShieldCheck, Video, Clock } from "lucide-react";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";
import { LogoutButton } from "@/components/logout-button";
import { VideoPlayer } from "@/components/video-player";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url: string) => (url.startsWith("http") ? url : `${apiOrigin}${url}`);

type Listing = {
  id: number;
  title: string;
  location: string;
  rent_amount: string;
  verification_status: string;
  images: { image: string }[];
  videos: { id: number; video: string }[];
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("hostel_mate_access_token");
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      try {
        const userRes = await authenticatedFetch(`${apiUrl}/auth/me/`);
        if (userRes.status === 401) throw new Error(SESSION_EXPIRED);
        if (!userRes.ok) throw new Error("Failed to load user");
        const userData = await userRes.json();
        setUser(userData);

        const listingsRes = await authenticatedFetch(`${apiUrl}/listings/?my_listings=true`);
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          setListings(Array.isArray(listingsData) ? listingsData : listingsData.results ?? []);
        }
      } catch (error) {
        if (error instanceof Error && error.message === SESSION_EXPIRED) {
          router.replace("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111827] text-white">
              <Home className="h-5 w-5" />
            </span>
            <span className="text-lg">Hostel Mate</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/listings" className="text-sm font-bold text-slate-600 hover:text-slate-900">Rooms</Link>
            <LogoutButton className="text-sm font-bold text-slate-500 hover:text-red-600" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold mb-2">My Account</h1>
          <p className="text-slate-500">Manage your identity verification and view your posted rooms.</p>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          <aside>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="font-bold text-lg mb-4">Identity Verification</h2>
              {user?.identity_verification_status === "approved" ? (
                <div className="flex items-start gap-3 bg-green-50 p-4 rounded-xl border border-green-100">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-900">Approved</p>
                    <p className="text-xs text-green-700 mt-1">Your identity is verified. Your posted rooms can now go live.</p>
                  </div>
                </div>
              ) : user?.identity_verification_status === "pending" ? (
                <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Pending Review</p>
                    <p className="text-xs text-amber-700 mt-1">Your documents are under review. You can post rooms, but they won't be public until approved.</p>
                  </div>
                </div>
              ) : user?.identity_verification_status === "rejected" ? (
                <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
                  <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900">Rejected</p>
                    <p className="text-xs text-red-700 mt-1">Your verification was rejected. Please resubmit your documents.</p>
                    <Link href="/onboarding" className="inline-block mt-2 text-xs font-bold text-red-700 underline">Resubmit</Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <ShieldAlert className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-700">Not Submitted</p>
                    <p className="text-xs text-slate-500 mt-1">You need to submit your credentials before you can post a room.</p>
                    <Link href="/onboarding" className="inline-block mt-2 text-xs font-bold text-[var(--primary)] underline">Submit now</Link>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Posted Rooms</h2>
              <Link href="/post" className="bg-[#111827] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition">
                Post a new room
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                <Home className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No rooms posted yet</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">When you post a room, it will appear here. You can track its approval status before it goes public.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {listings.map((listing) => {
                  const image = listing.images?.[0]?.image;
                  const video = listing.videos?.[0]?.video;

                  return (
                    <article key={listing.id} className="overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200 flex flex-col">
                      <div className="relative aspect-[1.3] overflow-hidden">
                        {image ? (
                          <img src={mediaUrl(image)} alt={listing.title} className="h-full w-full object-cover" />
                        ) : video ? (
                          <VideoPlayer src={mediaUrl(video)} muted className="h-full w-full" />
                        ) : (
                          <div className="grid h-full place-items-center bg-slate-100 text-sm font-semibold text-slate-500">No media</div>
                        )}
                        
                        <div className="absolute top-3 left-3">
                          {listing.verification_status === "verified" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#15803d] px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
                              <ShieldCheck className="h-3 w-3" /> Live (Public)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
                              <Clock className="h-3 w-3" /> Pending Approval
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <p className="flex items-center gap-1 text-sm font-semibold text-slate-500">
                          <MapPin className="h-4 w-4" /> {listing.location}
                        </p>
                        <h3 className="mt-1 text-lg font-bold line-clamp-1">{listing.title}</h3>
                        <p className="mt-auto pt-4 text-lg font-black">₦{Number(listing.rent_amount).toLocaleString()}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
