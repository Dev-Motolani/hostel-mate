"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, User, Home as HomeIcon, Upload, ArrowRight, ShieldCheck, CheckCircle2, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authenticatedFetch, SESSION_EXPIRED } from "@/lib/auth";
import { PageSkeleton } from "@/components/page-skeleton";

const NIGERIAN_UNIVERSITIES = [
  "University of Ilorin", "University of Ibadan", "University of Lagos", "University of Nigeria, Nsukka",
  "Obafemi Awolowo University", "Ahmadu Bello University", "University of Benin", "Bayero University Kano",
  "Federal University of Technology, Minna", "Kwara State University", "Lagos State University",
  "Ladoke Akintola University of Technology", "Covenant University", "Babcock University",
];

const UNILORIN_DEPARTMENTS = [
  "Accounting", "Agricultural Economics and Farm Management", "Architecture", "Biochemistry", "Biology",
  "Business Administration", "Chemical Engineering", "Chemistry", "Civil Engineering", "Computer Engineering",
  "Computer Science", "Economics", "Electrical and Electronics Engineering", "English", "Finance", "Geography",
  "Geology and Mineral Science", "Industrial Chemistry", "Information and Communication Science", "Law", "Mathematics",
  "Mechanical Engineering", "Medicine and Surgery", "Microbiology", "Nursing Science", "Pharmacy", "Physics",
  "Political Science", "Psychology", "Sociology", "Statistics", "Veterinary Medicine",
];

const COMMON_DEPARTMENTS = [
  "Accounting", "Architecture", "Biochemistry", "Business Administration", "Computer Science", "Economics",
  "Education", "Electrical Engineering", "English", "Law", "Mass Communication", "Mathematics",
  "Medicine and Surgery", "Microbiology", "Nursing Science", "Pharmacy", "Political Science", "Psychology", "Sociology",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"student" | "landlord" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [school, setSchool] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [ownershipProof, setOwnershipProof] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraMode, setCameraMode] = useState<"id" | "selfie">("selfie");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [idCardConfirmed, setIdCardConfirmed] = useState(false);
  const [verificationConsent, setVerificationConsent] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => {
    if (step === 2) router.push("/listings");
    else setStep((prev) => prev - 1);
  };

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"}/auth/me/`);
        if (!response.ok) throw new Error("Unable to load account");
        const user = await response.json();
        if (user.is_verified_poster) { router.replace("/post"); return; }
        setRole(user.account_type);
        setStep(2);
      } catch (error) {
        if (error instanceof Error && error.message === SESSION_EXPIRED) router.replace("/login");
      } finally { setIsCheckingAccount(false); }
    };
    loadAccount();
  }, [router]);

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
    return () => undefined;
  }, [stream, cameraOpen]);

  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const openCamera = async (mode: "id" | "selfie") => {
    setCameraError("");
    setCameraMode(mode);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported by this browser. Please use a modern browser over HTTPS.");
      setCameraOpen(true);
      return;
    }
    try {
      const deviceStream = await navigator.mediaDevices.getUserMedia({
        video: mode === "id"
          ? { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(deviceStream);
      setCameraOpen(true);
    } catch {
      setCameraError("We could not access your camera. Allow camera permission and try again.");
      setCameraOpen(true);
    }
  };

  const captureCameraImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const isIdCard = cameraMode === "id";
    const cardRatio = 1.586;
    const sourceRatio = video.videoWidth / video.videoHeight;
    const sourceWidth = isIdCard ? Math.min(video.videoWidth, video.videoHeight * cardRatio) : video.videoWidth;
    const sourceHeight = isIdCard ? sourceWidth / cardRatio : video.videoHeight;
    const sourceX = (video.videoWidth - sourceWidth) / 2;
    const sourceY = (video.videoHeight - sourceHeight) / 2;
    if (isIdCard && sourceWidth < 800) {
      setCameraError("The card image is too small. Move closer to the card and try again so the text is readable.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);
    canvas.getContext("2d")?.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const image = new File([blob], isIdCard ? "student-id-card.jpg" : "live-selfie.jpg", { type: "image/jpeg" });
      if (isIdCard) {
        setIdDocument(image);
        setIdPreview(URL.createObjectURL(image));
        setIdCardConfirmed(false);
      } else {
        setSelfie(image);
        setSelfiePreview(URL.createObjectURL(image));
      }
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const selectIdCardFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setVerificationError("Upload an image of your physical student ID card. PDF and selfie uploads are not accepted for this step.");
      return;
    }
    setVerificationError("");
    setIdDocument(file);
    setIdPreview(URL.createObjectURL(file));
    setIdCardConfirmed(false);
  };

  const submitVerification = async () => {
    if (!verificationConsent) {
      setVerificationError("You must give consent before we can review your verification documents.");
      return;
    }
    if (role === "student") {
      const missingItems = [
        !phoneNumber && "phone number",
        !identityDocumentNumber && "student ID-card number",
        !school && "school",
        !department && "department",
        !level && "level",
        !idDocument && "student ID-card image",
        !selfie && "live selfie",
        !idCardConfirmed && "ID-card confirmation checkbox",
      ].filter(Boolean);
      if (missingItems.length) {
        setVerificationError(`Please complete: ${missingItems.join(", ")}.`);
        return;
      }
    }
    if (role === "landlord" && (!phoneNumber || !propertyLocation || !ownershipProof)) {
      setVerificationError("Add your phone number, primary property location, and proof of ownership before submitting.");
      return;
    }
    setVerificationError("");
    setVerificationMessage("");
    setIsSubmittingVerification(true);
    const formData = new FormData();
    formData.append("role", role ?? "student");
    formData.append("phone_number", phoneNumber);
    if (role === "student") formData.append("identity_document_number", identityDocumentNumber);
    formData.append("verification_consent", String(verificationConsent));
    formData.append("business_name", businessName);
    formData.append("property_location", propertyLocation);
    formData.append("school", school);
    formData.append("department", department);
    formData.append("level", level);
    if (idDocument) formData.append("id_card", idDocument);
    if (selfie) formData.append("live_selfie", selfie);
    if (ownershipProof) formData.append("ownership_proof", ownershipProof);
    try {
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"}/verification/`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? data.non_field_errors?.[0] ?? "Unable to submit verification.");
      if (data.status === "rejected") {
        throw new Error(data.rejection_message || data.review_note || "Your verification could not be approved. Please review your details and submit again.");
      }
      setVerificationComplete(true);
      router.push("/post");
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === SESSION_EXPIRED) { router.replace("/login"); return; }
      setVerificationError(requestError instanceof Error ? requestError.message : "Unable to submit verification.");
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  if (isCheckingAccount) return <PageSkeleton cards={1} />;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Home className="text-[var(--primary)] h-5 w-5" />
            <span className="font-bold text-lg text-[var(--foreground)] tracking-tight">Hostel Mate</span>
          </Link>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-[var(--primary)]" : i < step ? "w-4 bg-[var(--primary)]/50" : "w-4 bg-[var(--border)]"
                }`} 
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-28 pb-12 px-4 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* STEP 1: SELECT ROLE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-3">Welcome! Let's get you set up.</h1>
                <p className="text-[var(--muted-foreground)]">How will you be using Hostel Mate?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Card */}
                <button 
                  onClick={() => setRole("student")}
                  className={`relative p-8 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                    role === "student" ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-md" : "border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--card)]"
                  }`}
                >
                  {role === "student" && (
                    <div className="absolute top-4 right-4 text-[var(--primary)]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 ${role === "student" ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary)] text-[var(--primary)]"}`}>
                    <User className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">I'm a Student</h3>
                  <p className="text-[var(--muted-foreground)] text-sm">I want to find a room or post a vacant room on behalf of someone else.</p>
                </button>

                {/* Landlord Card */}
                <button 
                  onClick={() => setRole("landlord")}
                  className={`relative p-8 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                    role === "landlord" ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-md" : "border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--card)]"
                  }`}
                >
                  {role === "landlord" && (
                    <div className="absolute top-4 right-4 text-[var(--primary)]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-6 ${role === "landlord" ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary)] text-[var(--primary)]"}`}>
                    <HomeIcon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">I'm a Landlord</h3>
                  <p className="text-[var(--muted-foreground)] text-sm">I own a property and want to list my vacant rooms directly to students.</p>
                </button>
              </div>

              <div className="mt-12 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={!role}
                  className="flex items-center justify-center py-3 px-8 rounded-xl font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Basic Details</h1>
                <p className="text-[var(--muted-foreground)] text-sm">Tell us a bit about yourself.</p>
              </div>

              <form className="space-y-5 bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+234 800 000 0000" className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                
                {role === "student" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">University / School</label>
                      <input type="text" list="nigerian-universities" value={school} onChange={(event) => { setSchool(event.target.value); setDepartment(""); }} placeholder="e.g University of Ilorin" className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                      <datalist id="nigerian-universities">{NIGERIAN_UNIVERSITIES.map((university) => <option key={university} value={university} />)}</datalist>
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">Choose an approved Nigerian university, or type your school if it is not yet listed.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Department / Programme</label>
                      <input type="text" list="school-departments" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder={school ? "e.g Computer Science" : "e.g Computer Science"} className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                      <datalist id="school-departments">{(school === "University of Ilorin" ? UNILORIN_DEPARTMENTS : COMMON_DEPARTMENTS).map((item) => <option key={item} value={item} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Level</label>
                      <select value={level} onChange={(event) => setLevel(event.target.value)} className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                        <option value="">Select Level</option>
                        <option value="100">100 Level</option>
                        <option value="200">200 Level</option>
                        <option value="300">300 Level</option>
                        <option value="400">400 Level</option>
                        <option value="500">500 Level</option>
                        <option value="postgrad">Postgraduate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Student ID-Card Number</label>
                      <input type="text" value={identityDocumentNumber} onChange={(event) => setIdentityDocumentNumber(event.target.value)} placeholder="Enter the number exactly as shown on your ID card" className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">Each ID card can be linked to only one Hostel Mate account.</p>
                    </div>
                  </>
                )}

                {role === "landlord" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Business Name (Optional)</label>
                      <input type="text" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Adebayo Hostels" className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Property Location</label>
                      <input type="text" value={propertyLocation} onChange={(event) => setPropertyLocation(event.target.value)} placeholder="e.g. Ilorin, Kwara State" className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                  </>
                )}
              </form>

              <div className="mt-8 flex justify-between">
                <button onClick={handleBack} className="px-6 py-3 font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Back</button>
                <button onClick={handleNext} className="flex items-center justify-center py-3 px-8 rounded-xl font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90">
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: VERIFICATION */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Identity Verification</h1>
                <p className="text-[var(--muted-foreground)] text-sm">We verify everyone to keep the platform safe and scam-free.</p>
              </div>

              <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm space-y-8">
                <div className="flex items-start gap-4 rounded-xl border border-green-200 bg-white p-4">
                  <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-300">Your documents are securely encrypted and only reviewed by admins. They will not be visible on your public profile.</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--foreground)]">
                  <input type="checkbox" checked={verificationConsent} onChange={(event) => setVerificationConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]" />
                  <span><span className="font-bold">I consent to verification.</span> I consent to Hostel Mate using my ID card, live selfie, and any ownership documents to review my poster verification. These documents are not public. Without consent, I cannot complete verification or post a room through Hostel Mate.</span>
                </label>

                {role === "student" ? (
                  <>
                    {/* Student Verification */}
                    <div>
                      <label className="block text-sm font-bold mb-3">1. Capture Student ID Card</label>
                      <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-5 text-center">
                        {idPreview ? <img src={idPreview} alt="Selected student ID card" className="mx-auto mb-3 aspect-[1.586] w-full max-w-xs rounded-lg object-cover" /> : <Camera className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />}
                        <p className="text-sm font-semibold text-[var(--primary)]">{idDocument ? "Student ID card selected" : "Capture or upload your physical student ID card"}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">This is not a selfie. It must show the entire physical ID card, including your photo, school name, and readable details.</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => openCamera("id")} className="inline-flex items-center gap-2 rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"><Camera className="h-4 w-4" /> {idDocument ? "Retake ID card" : "Open ID camera"}</button><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--secondary)]"><Upload className="h-4 w-4" /> Upload ID image<input type="file" accept="image/*" onChange={(event) => selectIdCardFile(event.target.files?.[0] ?? null)} className="sr-only" /></label></div>
                        {idDocument && <label className="mt-4 flex cursor-pointer items-start gap-2 text-left text-xs text-[var(--muted-foreground)]"><input type="checkbox" checked={idCardConfirmed} onChange={(event) => setIdCardConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" /><span>I confirm this is my valid physical student ID card, not a selfie or another document.</span></label>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold mb-3">2. Live Selfie</label>
                      <div className="border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-4 bg-[var(--background)]">
                        <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                          {selfiePreview && <img src={selfiePreview} alt="Live selfie" className="h-12 w-12 rounded-full object-cover" />}
                          <span>{selfie ? "Live selfie captured. You can retake it if needed." : "Take a quick selfie to match your ID."}</span>
                        </div>
                        <button type="button" onClick={() => openCamera("selfie")} className="inline-flex shrink-0 items-center gap-2 px-4 py-2 bg-[var(--secondary)] text-[var(--primary)] rounded-lg text-sm font-bold hover:bg-[var(--primary)] hover:text-white transition-colors">
                          <Camera className="h-4 w-4" /> {selfie ? "Retake" : "Open Camera"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Landlord Verification */}
                    <div>
                      <label className="block text-sm font-bold mb-3">Upload Proof of Ownership</label>
                      <p className="text-xs text-[var(--muted-foreground)] mb-3">E.g., Utility bill in your name, property deed, or government ID matching property documents.</p>
                      <label className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[var(--secondary)]/30 transition-colors cursor-pointer relative overflow-hidden group">
                        <input type="file" accept="image/*,.pdf" onChange={(event) => setOwnershipProof(event.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <Upload className="h-8 w-8 text-[var(--muted-foreground)] mb-3 group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-sm font-semibold text-[var(--primary)]">{ownershipProof ? ownershipProof.name : "Click to upload documents"}</span>
                        <span className="text-xs text-[var(--muted-foreground)] mt-1">JPEG, PNG or PDF (max. 10MB)</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {cameraOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">{cameraMode === "id" ? "Capture your student ID card" : "Take your live selfie"}</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{cameraMode === "id" ? "Fit the whole card inside the guide. Keep the writing sharp and avoid glare." : "Keep your face inside the frame and use good lighting."}</p></div><button onClick={stopCamera} aria-label="Close camera" className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
                  {cameraError ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{cameraError}</div> : <div className="relative"><video ref={videoRef} autoPlay playsInline muted className={`${cameraMode === "id" ? "aspect-video" : "aspect-square"} w-full rounded-2xl bg-slate-950 object-cover`} />{cameraMode === "id" && <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-[1.586] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-white shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />}</div>}
                  <div className="mt-4 flex gap-3"><button onClick={stopCamera} className="flex-1 rounded-xl border border-[var(--border)] py-3 text-sm font-bold">Cancel</button><button disabled={!stream} onClick={captureCameraImage} className="flex-1 rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-white disabled:opacity-50">{cameraMode === "id" ? "Capture ID card" : "Capture selfie"}</button></div>
                </div>
              </div>}

              <div className="mt-8">
                {verificationError && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{verificationError}</p>}
                {verificationMessage && <p role="status" className="mb-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{verificationMessage}</p>}
                <div className="grid grid-cols-2 gap-3"><button type="button" onClick={handleBack} className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]">Back</button><button disabled={isSubmittingVerification} onClick={submitVerification} className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-70">{isSubmittingVerification ? "Submitting…" : "Submit Verification"}</button></div>
              </div>
              {verificationComplete && <div role="status" className="fixed right-4 top-4 z-[70] flex max-w-sm items-start gap-3 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white shadow-xl sm:right-6 sm:top-6"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><span>Verification submitted successfully.</span></div>}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
