"use client";

import { LogOut } from "lucide-react";

export function LogoutButton({ className, text = "Log out" }: { className?: string, text?: string }) {
  const handleLogout = () => {
    localStorage.removeItem("hostel_mate_access_token");
    localStorage.removeItem("hostel_mate_refresh_token");
    window.location.href = "/login";
  };

  return (
    <button onClick={handleLogout} className={`flex items-center gap-2 ${className}`}>
      <LogOut className="h-4 w-4" />
      {text}
    </button>
  );
}
