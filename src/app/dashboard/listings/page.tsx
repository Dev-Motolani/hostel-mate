"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/page-skeleton";
import { MapPin, ShieldCheck, XCircle, CheckCircle } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url?: string) => (url ? (url.startsWith("http") ? url : `${apiOrigin}${url}`) : "");

type Listing = {
  id: number;
  title: string;
  location: string;
  rent_amount: string;
  verification_status: string;
  images: { image: string }[];
  videos: { id: number; video: string }[];
  owner_name: string;
};

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await authenticatedFetch(`${apiUrl}/admin/listings/?verification_status=submitted`);
        if (response.status === 403) {
          router.replace("/");
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch listings");
        const data = await response.json();
        setListings(Array.isArray(data) ? data : data.results ?? []);
      } catch (error) {
        if (error instanceof Error && error.message === SESSION_EXPIRED) router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, [router]);

  const updateStatus = async (id: number, status: string) => {
    setIsUpdating(id);
    try {
      const response = await authenticatedFetch(`${apiUrl}/admin/listings/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      
      // Remove from list if approved or rejected
      setListings((current) => current.filter((listing) => listing.id !== id));
    } catch (error) {
      alert("Failed to update listing status. Please try again.");
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Pending Rooms</h1>
      <p className="text-slate-500 mb-8">Review and approve rooms submitted by users.</p>

      {listings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">There are no pending rooms awaiting verification at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {listings.map((listing) => {
            const image = listing.images?.[0]?.image;
            const video = listing.videos?.[0]?.video;

            return (
              <article key={listing.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-64 h-48 md:h-full shrink-0 relative bg-slate-100">
                  {image ? (
                    <img src={mediaUrl(image)} alt={listing.title} className="h-full w-full object-cover" />
                  ) : video ? (
                    <VideoPlayer src={mediaUrl(video)} muted className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-sm font-semibold text-slate-500">No media</div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 mb-1">
                    <MapPin className="h-4 w-4" /> {listing.location}
                  </div>
                  <h3 className="text-xl font-bold line-clamp-1">{listing.title}</h3>
                  <p className="text-lg font-black mt-2">₦{Number(listing.rent_amount).toLocaleString()}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      By: <span className="text-slate-900">{listing.owner_name}</span>
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      disabled={isUpdating === listing.id}
                      onClick={() => updateStatus(listing.id, "verified")}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold transition disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" /> Approve
                    </button>
                    <button
                      disabled={isUpdating === listing.id}
                      onClick={() => updateStatus(listing.id, "rejected")}
                      className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold transition disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" /> Reject
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
