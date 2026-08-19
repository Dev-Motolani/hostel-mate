"use client";

import Link from "next/link";
import { Home, LayoutDashboard, Users, Building } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 min-h-screen">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight mb-10">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111827] text-white">
              <Home className="h-5 w-5" />
            </span>
            <span className="text-lg">Hostel Mate</span>
          </Link>
          
          <nav className="space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-bold">
              <LayoutDashboard className="h-5 w-5" /> Overview
            </Link>
            <Link href="/dashboard/listings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-bold">
              <Building className="h-5 w-5" /> Listings Verification
            </Link>
            <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-bold">
              <Users className="h-5 w-5" /> User Verification
            </Link>
            
            <div className="pt-8 mt-8 border-t border-slate-100">
              <LogoutButton className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-bold w-full" />
            </div>
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
