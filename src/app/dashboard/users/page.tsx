"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";
import { ShieldCheck, XCircle, CheckCircle, Image as ImageIcon } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url?: string) => (url ? (url.startsWith("http") ? url : `${apiOrigin}${url}`) : "");

type UserVerification = {
  id: number;
  user: number;
  role: string;
  phone_number: string;
  school: string;
  department: string;
  level: string;
  status: string;
  status_label: string;
  submitted_at: string;
  id_card?: string;
  live_selfie?: string;
  business_name?: string;
  property_location?: string;
  ownership_proof?: string;
};

const REJECTION_REASONS = [
  { value: "invalid_id_card", label: "Invalid ID Card" },
  { value: "selfie_mismatch", label: "Selfie Mismatch" },
  { value: "unreadable_documents", label: "Unreadable Documents" },
  { value: "other", label: "Other" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("invalid_id_card");
  const [reviewNote, setReviewNote] = useState("");

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("hostel_mate_access_token") : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      try {
        const response = await authenticatedFetch(`${apiUrl}/admin/users/verifications/?status=pending`);
        if (response.status === 403) {
          router.replace("/");
          return;
        }
        const data = await response.json();
        setVerifications(Array.isArray(data) ? data : data.results ?? []);
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

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const payload: any = { status };
      if (status === "rejected") {
        payload.rejection_reason = rejectionReason;
        if (reviewNote) payload.review_note = reviewNote;
      }

      const response = await authenticatedFetch(`${apiUrl}/admin/users/verifications/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update status");
      
      setVerifications((current) => current.filter((v) => v.id !== id));
      setRejectingId(null);
      setReviewNote("");
    } catch (error) {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2">User Verification</h1>
      <p className="text-slate-500 mb-8">Review submitted IDs and selfies to verify students and landlords.</p>

      {verifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">There are no pending identity verifications awaiting review.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {verifications.map((v) => (
            <div key={v.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <div className="flex flex-col xl:flex-row gap-8">
                {/* User Info */}
                <div className="xl:w-1/3">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      {v.role}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500">Phone Number</h4>
                      <p className="font-bold text-lg">{v.phone_number || "N/A"}</p>
                    </div>

                    {v.role === "student" ? (
                      <>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500">School</h4>
                          <p className="font-bold text-lg">{v.school}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500">Academics</h4>
                          <p className="font-semibold text-slate-700">{v.department} • {v.level}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500">Business Name</h4>
                          <p className="font-bold text-lg">{v.business_name || "N/A"}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500">Property Location</h4>
                          <p className="font-semibold text-slate-700">{v.property_location}</p>
                        </div>
                        {v.ownership_proof && (
                          <a href={mediaUrl(v.ownership_proof)} target="_blank" rel="noreferrer" className="text-sm font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" /> View Ownership Proof
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Documents & Actions */}
                <div className="xl:w-2/3 flex flex-col justify-between">
                  {v.role === "student" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2">ID Card</h4>
                        <div className="bg-slate-100 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-200">
                          {v.id_card ? (
                            <img src={mediaUrl(v.id_card)} alt="ID Card" className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(mediaUrl(v.id_card), "_blank")} />
                          ) : (
                            <span className="text-slate-400 text-sm font-semibold">No ID Card</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2">Live Selfie</h4>
                        <div className="bg-slate-100 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-200">
                          {v.live_selfie ? (
                            <img src={mediaUrl(v.live_selfie)} alt="Live Selfie" className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(mediaUrl(v.live_selfie), "_blank")} />
                          ) : (
                            <span className="text-slate-400 text-sm font-semibold">No Selfie</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {rejectingId === v.id ? (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-4">
                      <h4 className="font-bold text-red-900">Reject Verification</h4>
                      <select 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-red-500 outline-none"
                      >
                        {REJECTION_REASONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <textarea
                        placeholder="Add a custom note (optional)"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-red-500 outline-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={updatingId === v.id}
                          onClick={() => updateStatus(v.id, "rejected")}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition text-sm disabled:opacity-50"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          disabled={updatingId === v.id}
                          onClick={() => setRejectingId(null)}
                          className="bg-white border border-red-200 text-red-900 hover:bg-red-100 px-4 py-2 rounded-xl font-bold transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 border-t border-slate-100 pt-6">
                      <button
                        disabled={updatingId === v.id}
                        onClick={() => updateStatus(v.id, "approved")}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold transition text-sm disabled:opacity-50"
                      >
                        <CheckCircle className="h-5 w-5" /> Approve Identity
                      </button>
                      <button
                        disabled={updatingId === v.id}
                        onClick={() => setRejectingId(v.id)}
                        className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-xl font-bold transition text-sm disabled:opacity-50"
                      >
                        <XCircle className="h-5 w-5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
