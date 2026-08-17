"use client";

type VideoPlayerProps = {
  src: string;
  className?: string;
  muted?: boolean;
};

export function VideoPlayer({ src, className = "", muted = false }: VideoPlayerProps) {
  const sourceType = src.split("?")[0].endsWith(".webm") ? "video/webm" : src.split("?")[0].endsWith(".mov") ? "video/quicktime" : "video/mp4";

  return (
    <div className={`relative bg-black ${className}`}>
      <video
        key={src}
        controls
        muted={muted}
        playsInline
        preload="metadata"
        className="block h-full w-full bg-black object-contain"
      >
        <source src={src} type={sourceType} />
      </video>
    </div>
  );
}
