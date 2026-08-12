"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PostRoomLinkProps = {
  className?: string;
  children: React.ReactNode;
};

/** Routes unauthenticated visitors to sign in before they can publish. */
export function PostRoomLink({ className, children }: PostRoomLinkProps) {
  const [destination, setDestination] = useState("/login");

  useEffect(() => {
    if (localStorage.getItem("hostel_mate_access_token")) setDestination("/post");
  }, []);

  return <Link href={destination} prefetch className={className}>{children}</Link>;
}
