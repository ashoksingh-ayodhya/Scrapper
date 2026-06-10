import { useState, type ReactNode } from 'react';

/**
 * Deep-dive comic frame: tries the real generated image from public/comics/
 * and falls back to the placeholder (icon + prompt text) until that file
 * exists. Lets the 40 images be dropped in with zero code changes.
 */
export default function ComicFrame({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="aspect-video w-full rounded-xl object-cover"
      onError={() => setFailed(true)}
    />
  );
}
