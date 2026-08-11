"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PostRoomLinkProps = {
  className?: string;
  children: React.ReactNode;
};

/** Routes unauthenticated visitors to sign in before they can publish. */
export function PostRoomLink({ className, children }: PostRoomLinkProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("hostel_mate_access_token")));
  }, []);

  return <Link href={isLoggedIn ? "/post" : "/login"} className={className}>{children}</Link>;
}
