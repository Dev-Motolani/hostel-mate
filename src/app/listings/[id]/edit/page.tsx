"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { Home, Upload, Image as ImageIcon, MapPin, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";

const standardFacilities = ["Running water", "Prepaid meter", "Wi-Fi", "Security", "Kitchen", "Kitchen cabinet", "Wardrobe", "Parking"];
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
const mediaUrl = (url: string) => url.startsWith("http") ? url : `${apiOrigin}${url}`;

type Listing = {
  id: number; title: string; location: string;
  facilities: string[]; images: { id: number; image: string }[]; videos: { id: number; video: string }[];
  can_edit_listing: boolean; can_manage_listing: boolean; created_at: string;
};

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  const responseText = await response.text();
  if (responseText.trimStart().startsWith("<!DOCTYPE") || responseText.includes("<html")) {
    return { detail: `The server returned an error page (${response.status}). Please try again after the backend deployment finishes.` };
  }
  return { detail: responseText || `The server returned ${response.status}.` };
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [location, setLocation] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [customFacility, setCustomFacility] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [keptImages, setKeptImages] = useState<{ id: number; image: string }[]>([]);
  const [keptVideos, setKeptVideos] = useState<{ id: number; video: string }[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editRemaining, setEditRemaining] = useState("");

  useEffect(() => {
    const loadListing = async () => {
      try {
        const response = await authenticatedFetch(`${apiUrl}/listings/${id}/`);
        if (response.status === 401) { router.replace("/login"); return; }
        if (!response.ok) {
          setAccessError("We could not load this listing.");
          return;
        }
        const data: Listing = await response.json();
        if (!data.can_manage_listing) { router.replace(`/listings/${id}`); return; }
        if (!data.can_edit_listing) {
          setAccessError("The 3-minute edit window has closed. Videos, location, and facilities can no longer be changed.");
          return;
        }
        setListing(data);
        setLocation(data.location);
        setFacilities(data.facilities);
        setKeptImages(data.images);
        setKeptVideos(data.videos);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.message === SESSION_EXPIRED) router.replace("/login");
        else setAccessError("We could not reach the Hostel Mate server. Please try again.");
      } finally { setIsLoading(false); }
    };
    void loadListing();
  }, [id, router]);

  useEffect(() => {
    if (!listing?.created_at) return;
    const deadline = new Date(listing.created_at).getTime() + 3 * 60 * 1000;
    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setAccessError("The 3-minute edit window has closed. Videos, location, and facilities can no longer be changed.");
        setEditRemaining("");
        return false;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setEditRemaining(`${minutes}:${String(seconds).padStart(2, "0")}`);
      return true;
    };
    if (!tick()) return;
    const timer = window.setInterval(() => { if (!tick()) window.clearInterval(timer); }, 1000);
    return () => window.clearInterval(timer);
  }, [listing?.created_at]);

  if (isLoading) return <PageSkeleton cards={1} />;
  if (accessError) return <div className="grid min-h-screen place-items-center px-4 text-center"><div><p className="max-w-md text-sm font-semibold text-red-700">{accessError}</p><Link href={`/listings/${id}`} className="mt-4 inline-block font-bold text-[var(--primary)]">Back to listing</Link></div></div>;
  if (!listing) return null;

  const toggleFacility = (facility: string) => setFacilities((current) => current.includes(facility) ? current.filter((item) => item !== facility) : [...current, facility]);
  const addMedia = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    const newPhotos = selected.filter((file) => file.type.startsWith("image/"));
    const newVideos = selected.filter((file) => file.type.startsWith("video/"));
    setPhotos((current) => [...current, ...newPhotos]);
    setVideos((current) => [...current, ...newVideos]);
    setPhotoPreviews((current) => [...current, ...newPhotos.map((file) => URL.createObjectURL(file))]);
    setVideoPreviews((current) => [...current, ...newVideos.map((file) => URL.createObjectURL(file))]);
  };
  const removePhoto = (index: number) => {
    const preview = photoPreviews[index];
    URL.revokeObjectURL(preview);
    if (activeImage === preview) setActiveImage(null);
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setPhotoPreviews((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };
  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setVideos((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setVideoPreviews((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };
  const addCustomFacility = () => {
    const item = customFacility.trim();
    if (item && !facilities.some((facility) => facility.toLowerCase() === item.toLowerCase())) setFacilities((current) => [...current, item]);
    setCustomFacility("");
  };

  async function uploadMedia(listingId: number, field: "images" | "videos", files: File[]) {
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((file) => formData.append(field, file));
    const response = await authenticatedFetch(`${apiUrl}/listings/${listingId}/${field}/`, { method: "POST", body: formData });
    if (!response.ok) {
      const data = await readApiResponse(response);
      throw new Error(data.detail || `Unable to upload ${field}.`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location.trim()) { setError("Enter a location."); return; }
    setError(""); setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(`${apiUrl}/listings/${listing.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim(), facilities }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(Object.values(data).flat().join(" ") || "Unable to save this listing.");
      const removedImages = listing.images.filter((image) => !keptImages.some((kept) => kept.id === image.id));
      const removedVideos = listing.videos.filter((video) => !keptVideos.some((kept) => kept.id === video.id));
      for (const image of removedImages) {
        const deleteResponse = await authenticatedFetch(`${apiUrl}/listings/${listing.id}/images/${image.id}/`, { method: "DELETE" });
        if (!deleteResponse.ok && deleteResponse.status !== 204) throw new Error("Unable to remove a photo.");
      }
      for (const video of removedVideos) {
        const deleteResponse = await authenticatedFetch(`${apiUrl}/listings/${listing.id}/videos/${video.id}/`, { method: "DELETE" });
        if (!deleteResponse.ok && deleteResponse.status !== 204) throw new Error("Unable to remove a video.");
      }
      await uploadMedia(listing.id, "images", photos);
      await uploadMedia(listing.id, "videos", videos);
      router.push(`/listings/${listing.id}`);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === SESSION_EXPIRED) { router.replace("/login"); return; }
      setError(requestError instanceof Error ? requestError.message : "Unable to save this listing.");
    } finally { setIsSubmitting(false); }
  }

  return <div className="min-h-screen bg-[var(--background)]">
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)] shadow-sm"><div className="container mx-auto flex h-16 items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-2"><Home className="h-6 w-6 text-[var(--primary)]" /><span className="hidden text-xl font-bold sm:block">Hostel Mate</span></Link>
      <Link href={`/listings/${listing.id}`} className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</Link>
    </div></header>
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><h1 className="mb-2 text-3xl font-bold">Edit listing</h1><p className="text-[var(--muted-foreground)]">You can change videos, location, and facilities for {editRemaining || "a few more seconds"}.</p></motion.div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><ImageIcon className="h-5 w-5 text-[var(--primary)]" />Photos and video</h2>
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] px-4 text-center text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]/30">
            <input type="file" multiple accept="image/*,video/*,.mp4,.mov,.webm,.m4v" className="sr-only" onChange={(event) => { addMedia(event.target.files); event.currentTarget.value = ""; }} />
            <Upload className="mb-2 h-7 w-7" /><span className="text-sm font-semibold">Add or replace photos or videos</span><span className="mt-1 text-xs">After 3 minutes from posting, videos can no longer be changed.</span>
          </label>
          {(keptImages.length > 0 || photoPreviews.length > 0) && <div className="mt-4"><p className="mb-2 text-center text-xs font-semibold text-[var(--muted-foreground)]">Photos</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-4">{keptImages.map((image) => <div key={image.id} className="group relative overflow-hidden rounded-xl border border-[var(--border)]"><button type="button" onClick={() => setActiveImage(mediaUrl(image.image))} className="block w-full"><img src={mediaUrl(image.image)} alt="Listing photo" className="aspect-video w-full object-cover sm:aspect-square" /></button><button type="button" onClick={() => setKeptImages((current) => current.filter((item) => item.id !== image.id))} aria-label="Remove photo" className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"><X className="h-4 w-4" /></button></div>)}{photoPreviews.map((preview, index) => <div key={preview} className="group relative overflow-hidden rounded-xl border border-[var(--border)]"><button type="button" onClick={() => setActiveImage(preview)} className="block w-full"><img src={preview} alt={`New room photo ${index + 1}`} className="aspect-video w-full object-cover sm:aspect-square" /></button><button type="button" onClick={() => removePhoto(index)} aria-label={`Remove photo ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"><X className="h-4 w-4" /></button></div>)}</div></div>}
          {(keptVideos.length > 0 || videoPreviews.length > 0) && <div className="mt-4"><p className="mb-2 text-center text-xs font-semibold text-[var(--muted-foreground)]">Videos</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{keptVideos.map((video) => <div key={video.id} className="relative"><video controls className="h-40 w-full rounded-xl bg-black object-contain"><source src={mediaUrl(video.video)} /></video><button type="button" onClick={() => setKeptVideos((current) => current.filter((item) => item.id !== video.id))} aria-label="Remove video" className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"><X className="h-4 w-4" /></button></div>)}{videoPreviews.map((preview, index) => <div key={preview} className="relative"><video controls className="h-40 w-full rounded-xl bg-black object-contain"><source src={preview} /></video><button type="button" onClick={() => removeVideo(index)} aria-label={`Remove video ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"><X className="h-4 w-4" /></button></div>)}</div></div>}
        </section>

        <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <Field label="Location / area"><div className="relative"><MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" /><input required name="location" value={location} onChange={(event) => setLocation(event.target.value)} list="unilorin-areas" placeholder="Oke-Odo, Tanke" className="input pl-10" /><datalist id="unilorin-areas"><option value="Oke-Odo, Tanke" /><option value="Tipper Garage" /><option value="Mark Fuel Station, University Road" /><option value="Pipeline, Tanke" /></datalist></div></Field>
          <fieldset><legend className="mb-3 block text-sm font-semibold">Room features</legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{standardFacilities.map((facility) => <label key={facility} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-medium"><input checked={facilities.includes(facility)} onChange={() => toggleFacility(facility)} type="checkbox" className="accent-[var(--primary)]" />{facility}</label>)}</div>
            <div className="mt-3 flex gap-2"><input value={customFacility} onChange={(event) => setCustomFacility(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomFacility(); } }} placeholder="Add another feature" className="input" /><button type="button" onClick={addCustomFacility} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold"><Plus className="h-4 w-4" />Add</button></div>
            {facilities.some((facility) => !standardFacilities.includes(facility)) && <div className="mt-3 flex flex-wrap gap-2">{facilities.filter((facility) => !standardFacilities.includes(facility)).map((facility) => <button type="button" onClick={() => toggleFacility(facility)} key={facility} className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-semibold">{facility} ×</button>)}</div>}
          </fieldset>
        </section>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        <button disabled={isSubmitting} type="submit" className="w-full rounded-xl bg-[var(--primary)] px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? "Saving…" : "Save changes"}</button>
      </form>
    </main>
    {activeImage && <div role="dialog" aria-modal="true" aria-label="Full-size room photo" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setActiveImage(null)}>
      <button type="button" aria-label="Close photo" onClick={() => setActiveImage(null)} className="absolute right-5 top-5 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"><X className="h-6 w-6" /></button>
      <img src={activeImage} alt="Full-size selected room" onClick={(event) => event.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain" />
    </div>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}<span className="mt-2 block">{children}</span></label>; }
