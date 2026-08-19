"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type AdminListing = {
  id: number;
  title: string;
  owner_name: string;
  verification_status: string;
  verification_status_label: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "preliminary_verified", label: "Preliminary Verified" },
  { value: "physical_verification", label: "Physical Verification" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "more_info_required", label: "More Info Required" },
];

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("hostel_mate_access_token") : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      try {
        const response = await authenticatedFetch(`${apiUrl}/admin/listings/`);
        if (response.status === 403) {
          router.replace("/");
          return;
        }
        const data = await response.json();
        setListings(Array.isArray(data) ? data : data.results ?? []);
      } catch (error) {
        if (error instanceof Error && error.message === SESSION_EXPIRED) {
          router.replace("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [accessToken, router]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await authenticatedFetch(`${apiUrl}/admin/listings/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: newStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        setListings((current) =>
          current.map((listing) => (listing.id === id ? { ...listing, verification_status: newStatus, verification_status_label: updated.verification_status_label } : listing))
        );
      }
    } catch (error) {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-8">Listings Verification</h1>
      
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">Listing Title</th>
              <th className="px-6 py-4 font-bold">Poster</th>
              <th className="px-6 py-4 font-bold">Date Submitted</th>
              <th className="px-6 py-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-800">{listing.title}</td>
                <td className="px-6 py-4">{listing.owner_name}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(listing.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <select
                    disabled={updatingId === listing.id}
                    value={listing.verification_status}
                    onChange={(e) => updateStatus(listing.id, e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-sm outline-none focus:ring-1 focus:ring-[#15803d]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">No listings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
