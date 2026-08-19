"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Home } from "lucide-react";
import { use, useEffect, useMemo, useState } from "react";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type Reservation = {
    id: number;
    listing: number;
    listing_title: string;
    status: string;
    status_label: string;
    agreed_rent_amount: string;
    agreed_caution_fee_amount: string;
    referral_amount: string;
    processor_amount: string;
    platform_amount: string;
    total_service_fee_amount: string;
    subtotal_amount: string;
    total_payable_amount: string;
};

function money(value: string) {
    return `NGN ${Number(value || 0).toLocaleString()}`;
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const accessToken = localStorage.getItem("hostel_mate_access_token");
        if (!accessToken) {
            router.replace("/login");
            return;
        }
        const loadReservation = async () => {
            try {
                const response = await authenticatedFetch(`${apiUrl}/reservations/${id}/`);
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.detail || "Unable to load payment details.");
                setReservation(payload);
            } catch (error) {
                if (error instanceof Error && error.message === SESSION_EXPIRED) {
                    router.replace("/login");
                    return;
                }
                setErrorMessage(error instanceof Error ? error.message : "Unable to load payment details.");
            } finally {
                setIsLoading(false);
            }
        };
        void loadReservation();
    }, [id, router]);

    const paymentReady = useMemo(() => reservation?.status === "pending_payment", [reservation?.status]);

    if (isLoading) return <PageSkeleton cards={1} />;

    if (!reservation) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                    <p className="text-xl font-extrabold">Unable to open payment</p>
                    <p className="mt-2 text-sm text-slate-600">{errorMessage || "Reservation details are not available."}</p>
                    <Link href="/listings" className="mt-5 inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">
                        Back to rooms
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111827] text-white">
                            <Home className="h-5 w-5" />
                        </span>
                        <span className="hidden sm:block">Hostel Mate</span>
                    </Link>
                    <Link href={`/listings/${reservation.listing}`} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
                        <ArrowLeft className="h-4 w-4" />
                        Back to listing
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
                <p className="text-xs font-bold tracking-wide text-[#15803d]">RESERVATION PAYMENT</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">{reservation.listing_title}</h1>
                <p className="mt-2 text-sm text-slate-600">Status: {reservation.status_label}</p>

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="text-lg font-extrabold">Payment breakdown</h2>
                        <div className="mt-4 space-y-3 text-sm">
                            <Row label="Basic rent" value={money(reservation.agreed_rent_amount)} />
                            <Row label="Caution fee" value={money(reservation.agreed_caution_fee_amount)} />
                            <Row label="Subtotal (rent + caution)" value={money(reservation.subtotal_amount)} strong />
                        </div>

                        <h3 className="mt-7 text-sm font-extrabold uppercase tracking-wide text-slate-700">Service fees</h3>
                        <div className="mt-3 space-y-3 text-sm">
                            <Row label="Poster referral fee" value={money(reservation.referral_amount)} />
                            <Row label="Payment processor fee" value={money(reservation.processor_amount)} />
                            <Row label="Hostel Mate platform fee" value={money(reservation.platform_amount)} />
                            <Row label="Total service fees" value={money(reservation.total_service_fee_amount)} strong />
                        </div>
                    </section>

                    <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount due now</p>
                        <p className="mt-2 text-3xl font-extrabold">{money(reservation.total_payable_amount)}</p>
                        <p className="mt-3 text-sm text-slate-600">
                            This total includes the basic rent, caution fee, and service fees attached to this reservation.
                        </p>
                        <button
                            type="button"
                            disabled
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] px-4 py-3.5 text-sm font-extrabold text-white opacity-60"
                        >
                            <CreditCard className="h-4 w-4" />
                            Pay now (gateway setup next)
                        </button>
                        {!paymentReady && (
                            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600">
                                This reservation is no longer in a payable state.
                            </p>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
            <span className={strong ? "font-bold text-slate-900" : "text-slate-600"}>{label}</span>
            <span className={strong ? "font-extrabold text-slate-900" : "font-semibold text-slate-800"}>{value}</span>
        </div>
    );
}
