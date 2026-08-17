"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Home, Upload, Image as ImageIcon, MapPin, Info, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";

const standardFacilities = ["Running water", "Prepaid meter", "Wi-Fi", "Security", "Kitchen", "Kitchen cabinet", "Wardrobe", "Parking"];
const durations = [3, 6, 8, 12, 18];
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  const responseText = await response.text();
  if (responseText.trimStart().startsWith("<!DOCTYPE") || responseText.includes("<html")) {
    return { detail: `The server returned an error page (${response.status}). Please try again after the backend deployment finishes.` };
  }
  return { detail: responseText || `The server returned ${response.status}.` };
}

export default function PostListingPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<string[]>([]);
  const [customFacility, setCustomFacility] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [leaseMonths, setLeaseMonths] = useState("12");
  const [customMonths, setCustomMonths] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingPosterAccess, setIsCheckingPosterAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [referralPercent, setReferralPercent] = useState(3);
  const [platformPercent, setPlatformPercent] = useState(5);

  useEffect(() => {
    const checkPosterAccess = async () => {
      try {
        const response = await authenticatedFetch(`${apiUrl}/auth/me/`);
        if (response.status === 401) { router.replace("/login"); return; }
        if (!response.ok) {
          setAccessError("We could not confirm your poster access. Ensure the Django server is running and the latest database migrations have been applied.");
          return;
        }
        const user = await response.json();
        if (!user.is_verified_poster) { router.replace("/onboarding"); return; }
        if (user.referral_fee_percent) setReferralPercent(Number(user.referral_fee_percent));
        if (user.platform_fee_percent) setPlatformPercent(Number(user.platform_fee_percent));
      } catch (requestError) {
        if (requestError instanceof Error && requestError.message === SESSION_EXPIRED) router.replace("/login");
        else setAccessError("We could not reach the Hostel Mate server. Please try again.");
      } finally { setIsCheckingPosterAccess(false); }
    };
    checkPosterAccess();
  }, [router]);

  if (isCheckingPosterAccess) return <PageSkeleton cards={1} />;
  if (accessError) return <div className="grid min-h-screen place-items-center px-4 text-center"><div><p className="max-w-md text-sm font-semibold text-red-700">{accessError}</p><Link href="/listings" className="mt-4 inline-block font-bold text-[var(--primary)]">Back to rooms</Link></div></div>;

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
    const months = Number(leaseMonths);
    if (!Number.isInteger(months) || months < 1 || months > 18) { setError("Enter a rental period from 1 to 18 months."); return; }
    setError(""); setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await authenticatedFetch(`${apiUrl}/listings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"), description: form.get("description"), location: form.get("location"),
          rent_amount: form.get("rent_amount"), payment_period: "year", lease_months: months,
          finder_phone: form.get("finder_phone"), contact_phone: form.get("contact_phone"), facilities,
        }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(Object.values(data).flat().join(" ") || "Unable to publish this listing.");
      await uploadMedia(data.id, "images", photos);
      await uploadMedia(data.id, "videos", videos);
      router.push(`/listings/${data.id}`);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === SESSION_EXPIRED) { router.replace("/login"); return; }
      setError(requestError instanceof Error ? requestError.message : "Unable to publish this listing.");
    } finally { setIsSubmitting(false); }
  }

  return <div className="min-h-screen bg-[var(--background)]">
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)] shadow-sm"><div className="container mx-auto flex h-16 items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-2"><Home className="h-6 w-6 text-[var(--primary)]" /><span className="hidden text-xl font-bold sm:block">Hostel Mate</span></Link>
      <Link href="/listings" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</Link>
    </div></header>
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><h1 className="mb-2 text-3xl font-bold">Post a Room</h1><p className="text-[var(--muted-foreground)]">Fill out the details to list a vacant room.</p></motion.div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><ImageIcon className="h-5 w-5 text-[var(--primary)]" />Photos and video</h2>
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] px-4 text-center text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]/30">
            <input type="file" multiple accept="image/*,video/*,.mp4,.mov,.webm,.m4v" className="sr-only" onChange={(event) => { addMedia(event.target.files); event.currentTarget.value = ""; }} />
            <Upload className="mb-2 h-7 w-7" /><span className="text-sm font-semibold">Add photos or videos</span><span className="mt-1 text-xs">Select as many as you want. Click again to add more.</span>
          </label>
          {(photos.length > 0 || videos.length > 0) && <div className="mt-4 space-y-4">
            {photoPreviews.length > 0 && <div><p className="mb-2 text-center text-xs font-semibold text-[var(--muted-foreground)]">Selected photos — click a photo to view it full screen</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-4">{photoPreviews.map((preview, index) => <div key={preview} className="group relative overflow-hidden rounded-xl border border-[var(--border)]"><button type="button" onClick={() => setActiveImage(preview)} className="block w-full"><img src={preview} alt={`Selected room photo ${index + 1}`} className="aspect-video w-full object-cover transition group-hover:scale-105 sm:aspect-square" /></button><button type="button" onClick={() => removePhoto(index)} aria-label={`Remove photo ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"><X className="h-4 w-4" /></button></div>)}</div></div>}
            {videoPreviews.length > 0 && <div><p className="mb-2 text-center text-xs font-semibold text-[var(--muted-foreground)]">Selected videos</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{videoPreviews.map((preview, index) => <div key={preview} className="relative"><video controls className="h-40 w-full rounded-xl bg-black object-contain"><source src={preview} /></video><button type="button" onClick={() => removeVideo(index)} aria-label={`Remove video ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"><X className="h-4 w-4" /></button></div>)}</div></div>}
          </div>}
        </section>

        <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"><h2 className="mb-2 flex items-center gap-2 text-xl font-bold"><Info className="h-5 w-5 text-[var(--primary)]" />Room details</h2>
          <Field label="Listing title"><input required name="title" placeholder="Spacious self-contain in Oke-Odo" className="input" /></Field>
          <Field label="Description"><textarea required name="description" rows={4} placeholder="Describe the room, facilities, water supply and security..." className="input" /></Field>
          <Field label="Location / area"><div className="relative"><MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" /><input required name="location" list="unilorin-areas" placeholder="Oke-Odo, Tanke" className="input pl-10" /><datalist id="unilorin-areas"><option value="Oke-Odo, Tanke" /><option value="Tipper Garage" /><option value="Mark Fuel Station, University Road" /><option value="Pipeline, Tanke" /></datalist></div></Field>
          <fieldset><legend className="mb-3 block text-sm font-semibold">Room features</legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{standardFacilities.map((facility) => <label key={facility} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-medium"><input checked={facilities.includes(facility)} onChange={() => toggleFacility(facility)} type="checkbox" className="accent-[var(--primary)]" />{facility}</label>)}</div>
            <div className="mt-3 flex gap-2"><input value={customFacility} onChange={(event) => setCustomFacility(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomFacility(); } }} placeholder="Add another feature" className="input" /><button type="button" onClick={addCustomFacility} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold"><Plus className="h-4 w-4" />Add</button></div>
            {facilities.some((facility) => !standardFacilities.includes(facility)) && <div className="mt-3 flex flex-wrap gap-2">{facilities.filter((facility) => !standardFacilities.includes(facility)).map((facility) => <button type="button" onClick={() => toggleFacility(facility)} key={facility} className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-semibold">{facility} ×</button>)}</div>}
          </fieldset>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"><h2 className="mb-4 text-xl font-bold">Rent pricing</h2><div className="grid gap-5 md:grid-cols-2"><Field label="Rent amount"><input required min="0" step="0.01" name="rent_amount" type="number" placeholder="250000" className="input" /></Field><Field label="Rental period"><select value={customMonths ? "custom" : leaseMonths} onChange={(event) => { setCustomMonths(event.target.value === "custom"); if (event.target.value !== "custom") setLeaseMonths(event.target.value); }} className="input">{durations.map((months) => <option key={months} value={months}>{months === 12 ? "Per year (12 months)" : months === 18 ? "Per 1½ years (18 months)" : `Per ${months} months`}</option>)}<option value="custom">Another number of months</option></select></Field></div>{customMonths && <div className="mt-5"><Field label="Number of months (1–18)"><input value={leaseMonths} onChange={(event) => setLeaseMonths(event.target.value)} required min="1" max="18" type="number" className="input" /></Field></div>}</section>

        <section className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"><h2 className="mb-2 text-xl font-bold">Contact and referral</h2><Field label="Finder&apos;s phone number"><input required name="finder_phone" type="tel" placeholder="08012345678" className="input" /></Field><Field label="Landlord/caretaker phone number"><input required name="contact_phone" type="tel" placeholder="08012345678" className="input" /></Field><div className="rounded-xl bg-[var(--secondary)]/40 p-4 text-sm leading-6 text-[var(--muted-foreground)]"><p className="font-bold text-[var(--foreground)]">{referralPercent + platformPercent}% booking fee on rent paid through Hostel Mate</p><p className="mt-1">You earn {referralPercent}% of the rent. Hostel Mate keeps {platformPercent}% to run payments and the platform. If more than one person posts the same room, the poster share goes to the listing the student paid through.</p></div></section>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        <button disabled={isSubmitting} type="submit" className="w-full rounded-xl bg-[var(--primary)] px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? "Publishing…" : "Publish listing"}</button>
      </form>
    </main>
    {activeImage && <div role="dialog" aria-modal="true" aria-label="Full-size room photo" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setActiveImage(null)}>
      <button type="button" aria-label="Close photo" onClick={() => setActiveImage(null)} className="absolute right-5 top-5 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"><X className="h-6 w-6" /></button>
      <img src={activeImage} alt="Full-size selected room" onClick={(event) => event.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain" />
    </div>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}<span className="mt-2 block">{children}</span></label>; }
