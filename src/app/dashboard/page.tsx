"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingListings: 0,
    pendingUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("hostel_mate_access_token") : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [listingsRes, usersRes] = await Promise.all([
          authenticatedFetch(`${apiUrl}/admin/listings/?verification_status=submitted`),
          authenticatedFetch(`${apiUrl}/admin/users/verifications/?status=pending`)
        ]);

        if (listingsRes.status === 403 || usersRes.status === 403) {
          router.replace("/");
          return;
        }

        const listingsData = await listingsRes.json();
        const usersData = await usersRes.json();

        setStats({
          pendingListings: listingsData.count ?? listingsData.length ?? 0,
          pendingUsers: usersData.count ?? usersData.length ?? 0,
        });
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

  if (isLoading) return <PageSkeleton />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-8">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/listings" className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 hover:ring-[var(--primary)] transition-all cursor-pointer block">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Listings</h2>
          <p className="text-4xl font-black mt-2 text-slate-800">{stats.pendingListings}</p>
        </Link>
        
        <Link href="/dashboard/users" className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 hover:ring-[var(--primary)] transition-all cursor-pointer block">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending User Verifications</h2>
          <p className="text-4xl font-black mt-2 text-slate-800">{stats.pendingUsers}</p>
        </Link>
      </div>
    </div>
  );
}
