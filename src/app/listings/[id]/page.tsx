"use client";

import Link from "next/link";
import { ArrowLeft, Check, Heart, Home, MapPin, MessageCircle, Share2, Sparkles } from "lucide-react";
import { use, useEffect, useState } from "react";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url: string) => url.startsWith("http") ? url : `${apiOrigin}${url}`;

type Listing = {
  id: number; title: string; location: string; rent_amount: string; rent_duration_label: string; description: string;
  facilities: string[]; owner_name: string; owner_school: string; owner_department: string; owner_level: string; finder_phone: string | null; contact_phone: string | null; is_contact_free: boolean; finder_fee: string;
  images: { image: string }[]; videos: { id: number; video: string }[]; likes_count: number; is_liked: boolean; can_edit_facilities: boolean;
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [liked, setLiked] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFacilities, setEditingFacilities] = useState(false);
  const [facilityDraft, setFacilityDraft] = useState("");
  const [isSavingFacilities, setIsSavingFacilities] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("hostel_mate_access_token");
    fetch(`${apiUrl}/listings/${id}/`, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }).then(async (response) => {
      if (!response.ok) throw new Error("Listing unavailable");
      return response.json();
    }).then((data) => { setListing(data); setLiked(data.is_liked); }).catch(() => setListing(null)).finally(() => setIsLoading(false));
  }, [id]);

  if (!listing) return <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center"><div><p className="text-xl font-extrabold">{isLoading ? "Loading room…" : "Listing unavailable"}</p><Link href="/listings" className="mt-3 inline-block font-bold text-[#15803d]">Back to rooms</Link></div></div>;
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
  const saveFacilities = async () => {
    setIsSavingFacilities(true);
    try {
      const facilities = facilityDraft.split(",").map((item) => item.trim()).filter(Boolean);
      const response = await authenticatedFetch(`${apiUrl}/listings/${room.id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facilities }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update facilities.");
      setListing((current) => current ? { ...current, facilities: data.facilities, can_edit_facilities: data.can_edit_facilities } : current);
      setEditingFacilities(false);
    } catch (error) {
      setShareMessage(error instanceof Error && error.message === SESSION_EXPIRED ? "Sign in to edit facilities" : error instanceof Error ? error.message : "Unable to update facilities");
    } finally { setIsSavingFacilities(false); }
  };
  return <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111827] text-white"><Home className="h-5 w-5" /></span><span className="hidden sm:block">Hostel Mate</span></Link>
      <Link href="/listings" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to rooms</Link>
    </div></header>
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-6 text-xs font-bold text-[#15803d]"><Link href="/listings" className="hover:underline">AVAILABLE ROOMS</Link></div>
      <section className="grid grid-cols-1 gap-3 overflow-hidden rounded-[28px] sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">{media.length > 0 ? media.map((item, index) => <div key={`${item.type}-${item.url}-${index}`} className={`relative w-full overflow-hidden rounded-2xl ${item.type === "video" ? "h-56 bg-black sm:col-span-2 sm:h-72 lg:col-span-3" : "aspect-[1.4] bg-slate-100"}`}>{item.type === "image" ? <img src={mediaUrl(item.url)} alt={`${room.title} media ${index + 1}`} className="h-full w-full object-cover" /> : <video controls className="block h-full w-full bg-black object-contain"><source src={mediaUrl(item.url)} /></video>}{index === 0 && <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold shadow-sm">LISTING MEDIA</span>}</div>) : <div className="grid aspect-[1.4] place-items-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">No photos or videos were uploaded.</div>}</section>
      <div className="mt-3 flex items-center justify-end gap-2"><span className="mr-auto text-xs font-semibold text-slate-500">{shareMessage}</span><button onClick={shareListing} aria-label="Share listing" className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"><Share2 className="h-4 w-4" /></button><button onClick={toggleLike} aria-label="Like listing" className="flex h-10 items-center gap-2 rounded-full bg-white px-3 text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"><Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} /><span className="text-xs font-bold">{room.likes_count}</span></button></div>
      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{room.location}</span></div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{room.title}</h1>
          <section className="mt-8"><h2 className="text-xl font-extrabold">About this room</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{room.description}</p></section>
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-extrabold">Posted by</h2><p className="mt-3 font-bold text-slate-800">{room.owner_name || "Poster name unavailable"}</p>{room.owner_school && <p className="mt-2 text-sm text-slate-600"><span className="font-bold">School:</span> {room.owner_school}</p>}{room.owner_department && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Department:</span> {room.owner_department}</p>}{room.owner_level && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Level:</span> {room.owner_level}</p>}{!room.owner_school && !room.owner_department && !room.owner_level && <p className="mt-2 text-sm text-slate-500">The poster has not provided academic details.</p>}</section>
          <section className="mt-8"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold">Facilities</h2><p className="mt-1 text-sm text-slate-500">What is available in this room and compound.</p></div>{room.can_edit_facilities && !editingFacilities && <button type="button" onClick={() => { setFacilityDraft(room.facilities.join(", ")); setEditingFacilities(true); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Edit facilities</button>}</div>{editingFacilities ? <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><label className="block text-sm font-semibold">Facilities, separated by commas<textarea value={facilityDraft} onChange={(event) => setFacilityDraft(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-[#15803d]" /></label><div className="mt-3 flex gap-3"><button type="button" disabled={isSavingFacilities} onClick={saveFacilities} className="rounded-xl bg-[#15803d] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{isSavingFacilities ? "Saving…" : "Save facilities"}</button><button type="button" disabled={isSavingFacilities} onClick={() => setEditingFacilities(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Cancel</button></div></div> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{room.facilities.map((item) => <p key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="grid h-5 w-5 place-items-center rounded-full bg-green-50 text-[#15803d]"><Check className="h-3.5 w-3.5" /></span>{item}</p>)}</div>}</section>
          <section className="mt-10 rounded-[24px] border border-green-100 bg-green-50/70 p-5"><p className="flex items-center gap-2 text-sm font-extrabold text-[#166534]"><Sparkles className="h-4 w-4" /> Safer room hunting</p><p className="mt-2 text-sm leading-6 text-slate-600">Inspect the room and confirm payment details directly with the owner before paying rent.</p></section>
        </div>
        <aside><div className="sticky top-24 rounded-[28px] bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.1)] ring-1 ring-slate-200"><p className="text-3xl font-extrabold">₦{Number(room.rent_amount).toLocaleString()}<span className="text-sm font-medium text-slate-400"> / {room.rent_duration_label.replace("Per ", "")}</span></p><p className="mt-1 text-sm text-slate-500">{room.is_contact_free ? "Contact is free for this listing" : `Finder’s fee: ₦${Number(room.finder_fee).toLocaleString()}`}</p><button onClick={() => setPhoneVisible((current) => !current)} className="mt-6 w-full rounded-2xl bg-[#15803d] px-4 py-4 text-sm font-extrabold text-white shadow-lg shadow-green-700/20 hover:bg-green-800">{phoneVisible ? "Hide contacts" : "Show contact numbers"}</button>{phoneVisible && <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">{room.finder_phone && <p><span className="font-bold">Finder:</span> {room.finder_phone}</p>}{room.contact_phone && <p><span className="font-bold">Landlord/caretaker:</span> {room.contact_phone}</p>}</div>}<button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50"><MessageCircle className="h-4 w-4" /> Message on WhatsApp</button><div className="mt-6 border-t border-slate-100 pt-5"><p className="flex items-center gap-2 text-sm font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white">{room.owner_name.charAt(0)}</span> {room.owner_name}</p>{room.owner_school && <p className="mt-3 text-sm text-slate-600"><span className="font-bold">School:</span> {room.owner_school}</p>}{room.owner_department && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Department:</span> {room.owner_department}</p>}{room.owner_level && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Level:</span> {room.owner_level}</p>}</div></div></aside>
      </div>
    </main>
  </div>;
}
