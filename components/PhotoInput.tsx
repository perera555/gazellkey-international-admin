"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // same limit as the API (lib/storage.ts)

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

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type) || file.size > MAX_SIZE) {
      toast.error("Please choose a JPG, PNG or WEBP picture up to 10 MB.");
      return;
    }
    setBusy(true);
    try {
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
                accept="image/jpeg,image/png,image/webp"
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
