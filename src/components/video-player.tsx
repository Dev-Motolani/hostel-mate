"use client";

type VideoPlayerProps = {
  src: string;
  className?: string;
  muted?: boolean;
};

export function VideoPlayer({ src, className = "", muted = false }: VideoPlayerProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <video controls muted={muted} playsInline preload="metadata" className="block h-full w-full bg-slate-100 object-cover">
        <source src={src} />
      </video>
    </div>
  );
}
