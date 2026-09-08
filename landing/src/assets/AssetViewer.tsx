import { useEffect, useRef, useState } from "react";
import type { CompanyAsset } from "./model";
import { AudioIcon, CloseIcon, ImageIcon, LinkIcon, VideoIcon } from "./icons";

/** Thumbnails never play. Videos load only when their card approaches the viewport. */
export function AssetThumbnail({ asset }: { asset: CompanyAsset }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || asset.kind !== "video") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [asset.kind]);

  const Icon = asset.kind === "image" ? ImageIcon : asset.kind === "video" ? VideoIcon : asset.kind === "audio" ? AudioIcon : LinkIcon;
  return (
    <div ref={ref} className="asset-thumbnail">
      {asset.kind === "image" && asset.contentUrl && !failed ? (
        <img src={asset.contentUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : asset.kind === "video" && asset.contentUrl && !failed && visible ? (
        <video
          src={asset.contentUrl}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          onLoadedMetadata={(event) => {
            // A tiny seek displays a real frame without starting playback.
            const video = event.currentTarget;
            if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(0.1, video.duration / 2);
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="asset-visual-placeholder"><Icon size={27} /><span>{failed ? "Preview unavailable" : asset.kind === "link" ? "External link" : asset.kind === "audio" ? "Audio" : asset.kind === "video" ? "Video" : "Image"}</span></div>
      )}
    </div>
  );
}

export function AssetViewer({ asset, onClose }: { asset: CompanyAsset; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const media = mediaRef.current;
    document.body.style.overflow = "hidden";
    // StrictMode replays setup after cleanup on the same media element.
    if (media && asset.contentUrl) media.src = asset.contentUrl;
    dialog.showModal();
    return () => {
      // Stop playback and release the request, even if the page unmounts.
      if (media) {
        media.pause();
        media.removeAttribute("src");
        media.load();
      }
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [asset.contentUrl]);

  return (
    <dialog
      ref={dialogRef}
      className="asset-dialog asset-viewer"
      aria-labelledby="asset-viewer-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <div className="asset-dialog-heading">
        <div><h2 id="asset-viewer-title">{asset.name}</h2>{asset.description && <p>{asset.description}</p>}</div>
        <button type="button" onClick={onClose} aria-label="Close preview" autoFocus><CloseIcon size={18} /></button>
      </div>
      <div className={`asset-viewer-media${failed ? " has-error" : ""}`}>
        {failed || !asset.contentUrl ? (
          <div className="asset-viewer-fallback" role="status">
            <p>This {asset.kind} could not be previewed.</p>
            <span>The file may be unavailable or use a format this browser cannot play. You can download the original below.</span>
          </div>
        ) : asset.kind === "image" ? (
          <img src={asset.contentUrl} alt={asset.name} onError={() => setFailed(true)} />
        ) : asset.kind === "video" ? (
          <video ref={(element) => { mediaRef.current = element; }} src={asset.contentUrl} controls playsInline preload="metadata" aria-label={asset.name} onError={() => setFailed(true)} />
        ) : asset.kind === "audio" ? (
          <div className="asset-viewer-audio"><AudioIcon size={48} /><audio ref={(element) => { mediaRef.current = element; }} src={asset.contentUrl} controls preload="metadata" aria-label={asset.name} onError={() => setFailed(true)} /></div>
        ) : null}
      </div>
      {asset.contentUrl && <div className="asset-viewer-footer"><a className="asset-button asset-button-secondary" href={asset.contentUrl} download={asset.originalFilename || asset.name}>Download original</a></div>}
    </dialog>
  );
}
