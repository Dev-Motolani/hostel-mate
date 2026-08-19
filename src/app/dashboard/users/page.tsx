"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

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
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
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
        const response = await authenticatedFetch(`${apiUrl}/admin/users/verifications/`);
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

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await authenticatedFetch(`${apiUrl}/admin/users/verifications/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        setVerifications((current) =>
          current.map((v) => (v.id === id ? { ...v, status: newStatus, status_label: updated.status_label } : v))
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
      <h1 className="text-3xl font-extrabold mb-8">User Verification</h1>
      
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">User / Role</th>
              <th className="px-6 py-4 font-bold">Academics</th>
              <th className="px-6 py-4 font-bold">Date Submitted</th>
              <th className="px-6 py-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {verifications.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-800">{v.phone_number}</p>
                  <p className="text-xs text-slate-500 uppercase">{v.role}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-800">{v.school || "N/A"}</p>
                  <p className="text-xs text-slate-500">{v.department} • {v.level}</p>
                </td>
                <td className="px-6 py-4 text-slate-500">{new Date(v.submitted_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <select
                    disabled={updatingId === v.id}
                    value={v.status}
                    onChange={(e) => updateStatus(v.id, e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-sm outline-none focus:ring-1 focus:ring-[#15803d]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {verifications.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">No verifications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
