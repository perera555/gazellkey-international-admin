"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
// The API allows 10 MB (lib/storage.ts), but the hosting accepts only about
// 4.5 MB per request, so bigger pictures must be shrunk first
const MAX_UPLOAD = 4 * 1024 * 1024;

const MAX_SIDE = 1000; // pixels - plenty for a profile photo

// Resizes a picture in the browser to at most 1000 px and saves it as JPEG,
// so phone photos of any size upload quickly. null = the browser cannot read it.
async function shrink(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale == 1 && ACCEPTED.includes(file.type) && file.size < 2 * 1024 * 1024) {
      bitmap.close();
      return file; // already small
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (context == null) return null;
    context.fillStyle = "#ffffff"; // transparent PNGs get a white background
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
}

// One photo: choose a picture from the computer (uploaded at once to
// `uploadTo`, which returns its address) or paste a link. The value is the
// photo's address, saved with the rest of the form.
export default function PhotoInput({
  id,
  label,
  value,
  onChange,
  uploadTo,
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadTo: string;
  help?: string;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [useLink, setUseLink] = useState(value != "" && !value.startsWith("/api/"));
  const [busy, setBusy] = useState(false);

  async function upload(chosen: File | undefined) {
    if (!chosen) return;
    setBusy(true);
    try {
      // big phone photos (and other picture types) are made small first.
      // If the browser cannot shrink it, a JPG / PNG / WEBP that is small enough
      // goes as it is (the server checks the file content).
      const shrunk = await shrink(chosen);
      const file = shrunk ?? (ACCEPTED.includes(chosen.type) && chosen.size <= MAX_UPLOAD ? chosen : null);
      if (file == null) {
        toast.error(
          chosen.size > MAX_UPLOAD && ACCEPTED.includes(chosen.type)
            ? "This picture is too large to send. Please choose a smaller photo (under 4 MB)."
            : "This picture cannot be read. Please save it as a JPG or PNG (iPhone HEIC photos need converting) and try again.",
        );
        return;
      }
      if (!ACCEPTED.includes(file.type) || file.size > MAX_UPLOAD) {
        toast.error("Please choose a JPG, PNG or WEBP picture up to 4 MB.");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(uploadTo, { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body.message ?? "The photo could not be uploaded.");
        return;
      }
      onChange(body.data.url);
      toast.success("Photo uploaded. Click Save to keep it.");
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-navy-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-slate-500">No photo</span>
          )}
        </div>
        <div className="min-w-60 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => setUseLink(false)} className={`btn-sm ${useLink ? "btn-outline" : "btn-navy"}`}>
              Choose from computer
            </button>
            <button type="button" onClick={() => setUseLink(true)} className={`btn-sm ${useLink ? "btn-navy" : "btn-outline"}`}>
              Use a link
            </button>
            {value ? (
              <button type="button" onClick={() => onChange("")} className="btn-sm btn-outline">
                Remove photo
              </button>
            ) : null}
          </div>
          {useLink ? (
            <input
              id={id}
              className="input"
              value={value}
              onChange={(event) => onChange(event.target.value.trim())}
              placeholder="https://... or /images/..."
            />
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => picker.current?.click()} className="btn-gold btn-sm">
                {busy ? "Uploading..." : value ? "Choose another picture" : "Choose a picture"}
              </button>
              <input
                ref={picker}
                id={id}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void upload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </>
          )}
          {help ? <p className="text-xs text-slate-500">{help}</p> : null}
        </div>
      </div>
    </div>
  );
}
