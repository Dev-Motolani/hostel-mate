"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, CreditCard, History, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";
import { LogoutButton } from "@/components/logout-button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type CreditTransaction = {
  id: number;
  credits: number;
  transaction_type: string;
  transaction_type_label: string;
  status: string;
  description: string;
  created_at: string;
};

type CreditWallet = {
  balance: number;
};

export default function CreditsPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(5000);
  const [purchaseError, setPurchaseError] = useState("");

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("hostel_mate_access_token") : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const walletResponse = await authenticatedFetch(`${apiUrl}/payments/credits/wallet/`);
        if (!walletResponse.ok) throw new Error("Unable to load wallet balance.");
        setWallet(await walletResponse.json());

        const txResponse = await authenticatedFetch(`${apiUrl}/credit-transactions/`);
        if (!txResponse.ok) throw new Error("Unable to load transactions.");
        const txData = await txResponse.json();
        setTransactions(Array.isArray(txData) ? txData : txData.results ?? []);
      } catch (error) {
        if (error instanceof Error && error.message === SESSION_EXPIRED) {
          router.replace("/login");
          return;
        }
        setLoadError(error instanceof Error ? error.message : "Unable to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [accessToken, router]);

  const purchaseCredits = async () => {
    if (purchaseAmount < 1000) {
      setPurchaseError("Minimum purchase is 1,000 Credits.");
      return;
    }
    setIsPurchasing(true);
    setPurchaseError("");
    try {
      const response = await authenticatedFetch(`${apiUrl}/payments/credits/initialize/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: purchaseAmount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to initialize payment.");
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment link returned.");
      }
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Unable to initialize payment.");
      setIsPurchasing(false);
    }
  };

  if (!accessToken || isLoading) return <PageSkeleton detail />;

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111827] text-white">
              <Home className="h-5 w-5" />
            </span>
            <span className="hidden sm:block">Hostel Mate</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/listings" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" /> Back to rooms
            </Link>
            <LogoutButton className="hidden sm:flex text-sm font-bold text-slate-500 hover:text-red-600" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">HostelMate Credits</h1>
          <p className="mt-4 text-lg text-slate-500">Buy credits to request inspections and access premium services.</p>
        </div>

        {loadError && (
          <div className="mb-8 rounded-xl bg-red-50 p-4 text-center text-sm font-bold text-red-700">
            {loadError}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Wallet Balance & Top up */}
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-700">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Available Balance</p>
                <p className="text-3xl font-black">{wallet?.balance?.toLocaleString() || 0}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold">Buy more credits</h2>
              <p className="mt-1 text-sm text-slate-500">1 Credit = 1 NGN</p>
              
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[2000, 5000, 10000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPurchaseAmount(amount)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      purchaseAmount === amount
                        ? "border-[#15803d] bg-[#15803d] text-white"
                        : "border-slate-200 text-slate-600 hover:border-[#15803d] hover:text-[#15803d]"
                    }`}
                  >
                    {amount.toLocaleString()}
                  </button>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="text-sm font-bold text-slate-700">Or enter custom amount</label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 grid w-12 place-items-center text-slate-400">₦</span>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 font-bold outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              {purchaseError && <p className="mt-3 text-sm font-medium text-red-600">{purchaseError}</p>}

              <button
                onClick={purchaseCredits}
                disabled={isPurchasing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-4 text-base font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                <CreditCard className="h-5 w-5" />
                {isPurchasing ? "Connecting to Paystack..." : `Pay ₦${purchaseAmount.toLocaleString()}`}
              </button>
            </div>
          </section>

          {/* Transaction History */}
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="flex items-center gap-2 text-xl font-extrabold">
              <History className="h-5 w-5 text-slate-400" /> Transaction History
            </h2>
            <div className="mt-6 space-y-4">
              {transactions.length === 0 ? (
                <div className="py-10 text-center text-sm font-medium text-slate-500">
                  No transactions yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800">{tx.description || tx.transaction_type_label || tx.transaction_type}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</p>
                      {tx.status !== "success" && (
                        <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {tx.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className={`font-black ${tx.credits > 0 ? "text-emerald-600" : "text-slate-800"}`}>
                      {tx.credits > 0 ? "+" : ""}{tx.credits}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
