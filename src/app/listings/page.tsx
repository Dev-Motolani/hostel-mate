"use client";

import Link from "next/link";
import { ChevronDown, Heart, Home, MapPin, Search, ShieldCheck, Sparkles, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PostRoomLink } from "@/components/post-room-link";
import { VideoPlayer } from "@/components/video-player";
import { PageSkeleton } from "@/components/page-skeleton";
import { LogoutButton } from "@/components/logout-button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url: string) => (url.startsWith("http") ? url : `${apiOrigin}${url}`);
const areas = ["All areas", "Oke-Odo, Tanke", "Mark Fuel Station", "Awolowo Road, Tanke", "Tipper Garage"];

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

export default function ListingsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");
  const [saved, setSaved] = useState<number[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("hostel_mate_access_token") : null;

  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const url = verifiedOnly ? `${apiUrl}/listings/?available=true&verified=true` : `${apiUrl}/listings/?available=true`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`The server returned ${response.status}.`);
        const data = await response.json();
        setListings(Array.isArray(data) ? data : data.results ?? []);
      } catch (error) {
        setListings([]);
        setLoadError(
          error instanceof TypeError
            ? "We cannot reach the Hostel Mate server right now."
            : error instanceof Error
              ? error.message
              : "We could not load rooms right now.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    void loadListings();
  }, [verifiedOnly]);

  const visibleListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          `${listing.title} ${listing.location} ${listing.facilities.join(" ")}`.toLowerCase().includes(query.toLowerCase()) &&
          (area === "All areas" || listing.location.includes(area)),
      ),
    [listings, query, area],
  );

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
          <div className="flex items-center gap-3">
            {accessToken && (
              <>
                <Link href="/account" className="hidden sm:flex text-sm font-bold text-slate-500 hover:text-slate-900 px-2">My Account</Link>
                <LogoutButton className="hidden sm:flex text-sm font-bold text-slate-500 hover:text-red-600 px-2" />
              </>
            )}
            <PostRoomLink className="rounded-full bg-[#111827] px-5 py-3 text-base font-bold text-white transition hover:bg-slate-700">Post a room</PostRoomLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6">
        <div className="mb-9 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#15803d]">
            <Sparkles className="h-4 w-4" /> TRUSTED CAMPUS HOSTELS
          </p>
          <h1 className="text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Find a hostel that fits.</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-500">Search hostels by location, budget, facilities, and verification status.</p>
        </div>

        <section className="mb-10 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-base outline-none placeholder:text-slate-400" placeholder="Search Oke-Odo, Mark, Tipper Garage..." />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3.5 text-base font-semibold lg:w-64">
              <MapPin className="h-4 w-4 text-[#15803d]" />
              <select value={area} onChange={(event) => setArea(event.target.value)} className="w-full appearance-none bg-transparent outline-none">
                {areas.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </label>
            <button
              type="button"
              onClick={() => setVerifiedOnly((current) => !current)}
              className={`rounded-2xl px-5 py-3.5 text-sm font-bold transition ${verifiedOnly ? "bg-[#15803d] text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {verifiedOnly ? "Verified only: ON" : "Verified only: OFF"}
            </button>
          </div>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Available rooms</h2>
            {!isLoading && <p className="mt-1 text-base text-slate-500">{visibleListings.length} rooms matching your search</p>}
          </div>
        </div>

        {isLoading && <PageSkeleton cards={8} />}

        {!isLoading && visibleListings.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {visibleListings.map((listing) => {
              const isSaved = saved.includes(listing.id);
              const image = listing.images[0]?.image;
              const video = listing.videos[0]?.video;
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
                      <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
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
                    <Link href={`/listings/${listing.id}`} prefetch className="mt-2 block text-xl font-extrabold tracking-tight hover:text-[#15803d]">
                      {listing.title}
                    </Link>
                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                      <p className="font-bold text-slate-800">{listing.owner_name || "Poster name unavailable"}</p>
                      <p className="mt-1 text-slate-500">{posterDetails || "Department and level unavailable"}</p>
                    </div>
                    <p className="mt-4 text-lg font-black">₦{Number(listing.rent_amount).toLocaleString()}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-[24px] bg-white px-6 py-20 text-center shadow-sm ring-1 ring-slate-200">
            <Video className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 text-lg font-bold">Unable to load rooms</p>
            <p className="mt-1 text-sm text-slate-500">{loadError}</p>
          </div>
        )}

        {!isLoading && !loadError && visibleListings.length === 0 && (
          <div className="rounded-[24px] bg-white px-6 py-20 text-center shadow-sm ring-1 ring-slate-200">
            <Video className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 text-lg font-bold">No posted rooms found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing your filters or switch off verified-only mode.</p>
          </div>
        )}
      </main>
    </div>
  );
}
