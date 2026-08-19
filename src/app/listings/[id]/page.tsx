"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Heart, Home, MapPin, MessageCircle, Pencil, Share2, Sparkles } from "lucide-react";
import { use, useEffect, useState } from "react";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { VideoPlayer } from "@/components/video-player";
import { PageSkeleton } from "@/components/page-skeleton";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url: string) => url.startsWith("http") ? url : `${apiOrigin}${url}`;

type Listing = {
  id: number; title: string; location: string; rent_amount: string; caution_fee_amount: string; rent_duration_label: string; description: string;
  facilities: string[]; owner_name: string; owner_school: string; owner_department: string; owner_level: string; finder_phone: string | null; contact_phone: string | null; referral_fee_percent: string; referral_fee: string; platform_fee_percent: string; platform_fee: string; total_fee_percent: string; total_fee: string;
  images: { image: string }[]; videos: { id: number; video: string }[]; likes_count: number; is_liked: boolean; can_edit_listing: boolean; can_manage_listing: boolean; is_available: boolean; created_at: string;
  is_hostelmate_verified: boolean; verification_status_label: string;
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [reservationOpen, setReservationOpen] = useState(false);
  const [inspectionConfirmed, setInspectionConfirmed] = useState(false);
  const [moveInDate, setMoveInDate] = useState("");
  const [reservationMessage, setReservationMessage] = useState("");
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [inspectionMessage, setInspectionMessage] = useState("");
  const [isRequestingInspection, setIsRequestingInspection] = useState(false);
  const [managementMessage, setManagementMessage] = useState("");
  const [isManagingListing, setIsManagingListing] = useState(false);
  const [listingLoadError, setListingLoadError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [editRemaining, setEditRemaining] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("hostel_mate_access_token");
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    setHasCheckedSession(true);
    authenticatedFetch(`${apiUrl}/listings/${id}/`).then(async (response) => {
      if (response.ok) return response.json();
      const payload = await response.json().catch(() => ({}));
      if (response.status === 404) throw new Error("This listing no longer exists or has been deleted.");
      throw new Error(payload.detail || "We could not load this listing. Please try again.");
    }).then((data) => { setListing(data); setLiked(data.is_liked); }).catch((error) => {
      setListing(null);
      if (error instanceof Error && error.message === SESSION_EXPIRED) {
        router.replace("/login");
        return;
      }
      setListingLoadError(error instanceof TypeError ? "We cannot reach the Hostel Mate server. Start the Django backend and try again." : error instanceof Error ? error.message : "We could not load this listing. Please try again.");
    }).finally(() => setIsLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!listing?.created_at || !listing.can_manage_listing) {
      setCanEdit(false);
      setEditRemaining("");
      return;
    }
    const deadline = new Date(listing.created_at).getTime() + 3 * 60 * 1000;
    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setCanEdit(false);
        setEditRemaining("");
        return false;
      }
      setCanEdit(true);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setEditRemaining(`${minutes}:${String(seconds).padStart(2, "0")}`);
      return true;
    };
    if (!tick()) return;
    const timer = window.setInterval(() => { if (!tick()) window.clearInterval(timer); }, 1000);
    return () => window.clearInterval(timer);
  }, [listing?.can_manage_listing, listing?.created_at]);

  if (!hasCheckedSession || isLoading) return <PageSkeleton detail />;

  if (!listing) return <div className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4 text-center"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200"><p className="text-xl font-extrabold">Unable to open this room</p><p className="mt-3 text-sm leading-6 text-slate-600">{listingLoadError || "This listing is no longer available."}</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-[#15803d] px-4 py-2.5 text-sm font-bold text-white">Try again</button><Link href="/listings" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Back to rooms</Link></div></div></div>;
  const room = listing;
  const media = [...room.images.map(({ image }) => ({ type: "image" as const, url: image })), ...room.videos.map(({ id: videoId, video }) => ({ type: "video" as const, url: video, id: videoId }))];
  const shareListing = async () => {
    const shareData = { title: room.title, text: `View ${room.title} on Hostel Mate`, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else { await navigator.clipboard.writeText(window.location.href); setShareMessage("Link copied"); window.setTimeout(() => setShareMessage(""), 2000); }
  };
  const toggleLike = async () => {
    try {
      const response = await authenticatedFetch(`${apiUrl}/listings/${room.id}/like/`, { method: liked ? "DELETE" : "POST" });
      if (!response.ok) throw new Error("Unable to update like.");
      const data = await response.json();
      setLiked(data.is_liked);
      setListing((current) => current ? { ...current, likes_count: data.likes_count, is_liked: data.is_liked } : current);
    } catch (error) {
      setShareMessage(error instanceof Error && error.message === SESSION_EXPIRED ? "Sign in to like this room" : "Unable to update like");
    }
  };
  const toggleContacts = () => {
    const nextVisible = !phoneVisible;
    setPhoneVisible(nextVisible);
    if (!nextVisible) return setContactMessage("");
    setContactMessage(!room.finder_phone && !room.contact_phone ? "The poster has not provided contact numbers for this listing." : "");
  };
  const messageOnWhatsApp = () => {
    const phone = room.contact_phone || room.finder_phone;
    if (!phone) {
      setPhoneVisible(true);
      setContactMessage("The poster has not provided a WhatsApp number for this listing.");
      return;
    }
    window.open(`https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "234")}`, "_blank", "noopener,noreferrer");
  };
  const createReservation = async () => {
    if (!inspectionConfirmed || !moveInDate) {
      setReservationMessage("Confirm that you inspected the room and choose a move-in date.");
      return;
    }
    setIsCreatingReservation(true);
    setReservationMessage("");
    try {
      const response = await authenticatedFetch(`${apiUrl}/listings/${room.id}/reserve/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inspection_confirmed: true, move_in_date: moveInDate }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to create reservation.");
      setReservationOpen(false);
      router.push(`/payment/${data.id}`);
    } catch (error) {
      setReservationMessage(error instanceof Error ? error.message : "Unable to create reservation.");
    } finally { setIsCreatingReservation(false); }
  };

  const requestInspection = async () => {
    setIsRequestingInspection(true);
    setInspectionMessage("");
    try {
      const response = await authenticatedFetch(`${apiUrl}/listings/${room.id}/request_inspection/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: "" }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.detail === "Insufficient HostelMate Credits for this request.") {
          throw new Error("You do not have enough HostelMate Credits. Please purchase credits to request an inspection.");
        }
        throw new Error(data.detail || "Unable to request inspection.");
      }
      setReservationOpen(false);
      router.push("/dashboard"); // Later go to the student dashboard
    } catch (error) {
      setInspectionMessage(error instanceof Error ? error.message : "Unable to request inspection.");
    } finally { setIsRequestingInspection(false); }
  };
  const deleteListing = async () => {
    setIsManagingListing(true);
    try {
      const response = await authenticatedFetch(`${apiUrl}/listings/${room.id}/`, { method: "DELETE" });
      if (response.status === 204 || response.ok) { setDeleteDialogOpen(false); router.push("/listings"); return; }
      const data = await response.json();
      throw new Error(data.detail || "Unable to delete this listing.");
    } catch (error) { setManagementMessage(error instanceof Error ? error.message : "Unable to delete this listing."); }
    finally { setIsManagingListing(false); }
  };
  return <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111827] text-white"><Home className="h-5 w-5" /></span><span className="hidden sm:block">Hostel Mate</span></Link>
      <Link href="/listings" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to rooms</Link>
    </div></header>
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-6 text-xs font-bold text-[#15803d]"><Link href="/listings" className="hover:underline">AVAILABLE ROOMS</Link></div>
      <section className="grid grid-cols-1 gap-3 rounded-[28px] sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">{media.length > 0 ? media.map((item, index) => <div key={`${item.type}-${item.url}-${index}`} className={`relative w-full rounded-2xl ${item.type === "video" ? "h-64 bg-black sm:col-span-2 sm:h-80 lg:col-span-3" : "aspect-[1.4] overflow-hidden bg-slate-100"}`}>{item.type === "image" ? <img src={mediaUrl(item.url)} alt={`${room.title} media ${index + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <VideoPlayer src={mediaUrl(item.url)} className="h-full w-full rounded-2xl" />}{index === 0 && <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold shadow-sm">LISTING MEDIA</span>}</div>) : <div className="grid aspect-[1.4] place-items-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">No photos or videos were uploaded.</div>}</section>
      <div className="mt-3 flex items-center justify-end gap-2"><span className="mr-auto text-xs font-semibold text-slate-500">{shareMessage}</span><button onClick={shareListing} aria-label="Share listing" className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"><Share2 className="h-4 w-4" /></button><button onClick={toggleLike} aria-label="Like listing" className="flex h-10 items-center gap-2 rounded-full bg-white px-3 text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"><Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} /><span className="text-xs font-bold">{room.likes_count}</span></button></div>
      <section className="mt-6 rounded-[24px] border border-green-100 bg-green-50/70 p-5"><p className="flex items-center gap-2 text-sm font-extrabold text-[#166534]"><Sparkles className="h-4 w-4" /> Safer room hunting</p><p className="mt-2 text-sm leading-6 text-slate-600">Inspect the room and confirm payment details directly with the owner before paying rent.</p></section>
      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{room.location}</span>{room.is_hostelmate_verified && <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10"><Check className="h-3 w-3" /> HostelMate Verified</span>}</div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{room.title}</h1>
          <section className="mt-8"><h2 className="text-xl font-extrabold">About this room</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{room.description}</p></section>
          {Number(room.caution_fee_amount) > 0 && <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-lg font-extrabold text-amber-900">Caution fee required</h2><p className="mt-2 text-sm text-amber-900/80">This hostel requires a caution fee of ₦{Number(room.caution_fee_amount).toLocaleString()} in addition to the rent.</p></section>}
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-extrabold">Posted by</h2><p className="mt-3 font-bold text-slate-800">{room.owner_name || "Poster name unavailable"}</p>{room.owner_school && <p className="mt-2 text-sm text-slate-600"><span className="font-bold">School:</span> {room.owner_school}</p>}{room.owner_department && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Department:</span> {room.owner_department}</p>}{room.owner_level && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Level:</span> {room.owner_level}</p>}{!room.owner_school && !room.owner_department && !room.owner_level && <p className="mt-2 text-sm text-slate-500">The poster has not provided academic details.</p>}</section>
          <section className="mt-8"><h2 className="text-xl font-extrabold">Facilities</h2><p className="mt-1 text-sm text-slate-500">What is available in this room and compound.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{room.facilities.map((item) => <p key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="grid h-5 w-5 place-items-center rounded-full bg-green-50 text-[#15803d]"><Check className="h-3.5 w-3.5" /></span>{item}</p>)}</div></section>
        </div>
        <aside><div className="sticky top-24 rounded-[28px] bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.1)] ring-1 ring-slate-200"><p className="text-3xl font-extrabold">₦{Number(room.rent_amount).toLocaleString()}<span className="text-sm font-medium text-slate-400"> / {room.rent_duration_label.replace("Per ", "")}</span></p><p className="mt-1 text-sm text-slate-500">{room.can_manage_listing ? `You earn ${Number(room.referral_fee_percent)}% (₦${Number(room.referral_fee).toLocaleString()}). Hostel Mate keeps ${Number(room.platform_fee_percent)}% (₦${Number(room.platform_fee).toLocaleString()}) when a student pays through this listing.` : `Paying through Hostel Mate adds a ${Number(room.total_fee_percent)}% fee (₦${Number(room.total_fee).toLocaleString()}): ${Number(room.referral_fee_percent)}% to the poster, ${Number(room.platform_fee_percent)}% to Hostel Mate.`}</p>{room.can_manage_listing ? <div className="mt-6"><p className="text-sm font-bold">Your listing</p><p className="mt-1 text-xs text-slate-500">{room.is_available ? "Students can see this room in search." : "This room has been deleted from available listings."}</p>{canEdit && room.is_available && <Link href={`/listings/${room.id}/edit`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] px-4 py-3.5 text-sm font-extrabold text-white"><Pencil className="h-4 w-4" /> Edit listing</Link>}{canEdit && room.is_available && <p className="mt-2 text-center text-xs text-slate-500">Videos, location, and facilities can be changed for {editRemaining} more.</p>}{room.is_available && <button onClick={() => setDeleteDialogOpen(true)} disabled={isManagingListing} className="mt-3 w-full rounded-2xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-60">Delete listing</button>}{managementMessage && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600">{managementMessage}</p>}</div> : <><button onClick={() => setReservationOpen(true)} className="mt-6 w-full rounded-2xl bg-[#15803d] px-4 py-4 text-sm font-extrabold text-white shadow-lg shadow-green-700/20 hover:bg-green-800">Request Inspection</button>{reservationMessage && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600">{reservationMessage}</p>}</>}<div className="mt-6 border-t border-slate-100 pt-5"><p className="flex items-center gap-2 text-sm font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white">{room.owner_name.charAt(0)}</span> {room.owner_name} <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-700/10"><Check className="h-3 w-3" /> Student Verified</span></p>{room.owner_school && <p className="mt-3 text-sm text-slate-600"><span className="font-bold">School:</span> {room.owner_school}</p>}{room.owner_department && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Department:</span> {room.owner_department}</p>}{room.owner_level && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Level:</span> {room.owner_level}</p>}</div></div></aside>
      </div>
      {reservationOpen && <div role="dialog" aria-modal="true" aria-labelledby="reservation-title" className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="reservation-title" className="text-xl font-extrabold">Request Inspection</h2><p className="mt-2 text-sm leading-6 text-slate-600">Requesting an inspection costs <span className="font-bold">5,000 HostelMate Credits</span>. Once requested, we will schedule an inspection for you to verify the room physically.</p><label className="mt-4 block text-sm font-bold">Planned inspection date<input type="date" value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>{inspectionMessage && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{inspectionMessage} {inspectionMessage.includes("Credits") && <Link href="/credits" className="underline font-bold block mt-1">Buy Credits</Link>}</p>}<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setReservationOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Cancel</button><button type="button" disabled={isRequestingInspection || !moveInDate} onClick={requestInspection} className="rounded-xl bg-[#15803d] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{isRequestingInspection ? "Requesting…" : "Request (5,000 Credits)"}</button></div></div></div>}
      {deleteDialogOpen && <div role="dialog" aria-modal="true" aria-labelledby="delete-listing-title" className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-lg font-black text-red-700">!</div><h2 id="delete-listing-title" className="mt-4 text-xl font-extrabold">Delete this listing?</h2><p className="mt-2 text-sm leading-6 text-slate-600">This removes <span className="font-bold text-slate-800">{room.title}</span> from available rooms. Students will no longer see it.</p>{managementMessage && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{managementMessage}</p>}<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={isManagingListing} onClick={() => setDeleteDialogOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Keep listing</button><button type="button" disabled={isManagingListing} onClick={deleteListing} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">{isManagingListing ? "Deleting…" : "Yes, delete"}</button></div></div></div>}
    </main>
  </div>;
}
