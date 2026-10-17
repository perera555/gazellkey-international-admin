"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmAction from "@/components/ConfirmAction";
import StatusBadge from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api-client";
import { GalleryPhoto } from "@/lib/types";

const STATUSES = ["PUBLISHED", "DRAFT", "ARCHIVED"] as const;

function ErrorText({ text }: { text: string }) {
  return text ? (
    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
      {text}
    </p>
  ) : null;
}

// Upload a new trip photo (file or link) - POST /api/gallery as multipart
export function GalleryUpload() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [useLink, setUseLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0); // remount = empty form

  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/gallery", { method: "POST", body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message ?? "Could not add the photo.");
        return;
      }
      setPreview(null);
      setFormKey((key) => key + 1);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form key={formKey} onSubmit={upload} className="card rise grid gap-6 p-6 lg:grid-cols-[18rem_1fr]">
      <input type="hidden" name="division" value="TRAVEL" />
      <div>
        <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-navy-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <p className="px-6 text-center text-sm text-slate-500">Photo preview</p>
          )}
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          <button type="button" onClick={() => { setUseLink(false); setPreview(null); }} className={`btn-sm ${useLink ? "btn-outline" : "btn-navy"}`}>
            Upload file
          </button>
          <button type="button" onClick={() => { setUseLink(true); setPreview(null); }} className={`btn-sm ${useLink ? "btn-navy" : "btn-outline"}`}>
            Use a link
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {useLink ? (
          <div className="sm:col-span-2">
            <label htmlFor="imageUrl" className="label">Image link *</label>
            <input
              id="imageUrl"
              name="imageUrl"
              required
              className="input"
              placeholder="https://... or /images/travel-ella.jpg"
              onChange={(event) => setPreview(event.target.value.trim() || null)}
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label htmlFor="file" className="label">Photo * <span className="font-normal text-slate-500">(JPG, PNG or WEBP, up to 10 MB)</span></label>
            <input id="file" name="file" type="file" required accept="image/jpeg,image/png,image/webp" onChange={onFile} className="input file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-1 file:text-sm file:text-white" />
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="title" className="label">Title *</label>
          <input id="title" name="title" required minLength={2} maxLength={120} className="input" placeholder="Sunrise at Sigiriya" />
        </div>
        <div>
          <label htmlFor="place" className="label">Place</label>
          <input id="place" name="place" maxLength={120} className="input" placeholder="Sigiriya" />
        </div>
        <div>
          <label htmlFor="country" className="label">Country</label>
          <input id="country" name="country" maxLength={100} className="input" placeholder="Sri Lanka" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="caption" className="label">Caption</label>
          <textarea id="caption" name="caption" rows={2} maxLength={500} className="input" />
        </div>
        <div>
          <label htmlFor="takenAt" className="label">Trip date</label>
          <input id="takenAt" name="takenAt" type="date" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sortOrder" className="label">Order</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={100} className="input" />
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" name="status" defaultValue="PUBLISHED" className="input">
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
        <div className="space-y-3 sm:col-span-2">
          <ErrorText text={error} />
          <button type="submit" disabled={busy} className="btn-gold">
            {busy ? "Uploading..." : "Add to gallery"}
          </button>
        </div>
      </div>
    </form>
  );
}

// One photo card: inline edit, publish / hide, delete
export function GalleryCard({ photo }: { photo: GalleryPhoto }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(changes: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const result = await apiRequest("PUT", `/api/gallery/${photo.id}`, changes);
    setBusy(false);
    if (!result.ok) {
      setError(result.data.message ?? "Could not save.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => {
      const value = String(form.get(name) ?? "").trim();
      return value == "" ? null : value;
    };
    const ok = await save({
      title: text("title"),
      caption: text("caption"),
      place: text("place"),
      country: text("country"),
      sortOrder: Number(form.get("sortOrder") ?? 0),
      status: form.get("status"),
    });
    if (ok) setEditing(false);
  }

  const place = [photo.place, photo.country].filter(Boolean).join(", ");

  return (
    <li className="card rise overflow-hidden">
      <div className="relative aspect-[4/3] bg-navy-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.title} className={`h-full w-full object-cover ${photo.status == "PUBLISHED" ? "" : "opacity-50 grayscale"}`} />
        <span className="absolute top-3 left-3">
          <StatusBadge value={photo.status} />
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-navy-950/70 px-2 py-0.5 text-xs text-white">#{photo.sortOrder}</span>
      </div>

      {editing ? (
        <form onSubmit={onSubmit} className="space-y-3 p-4">
          <input name="title" required minLength={2} maxLength={120} defaultValue={photo.title} className="input" aria-label="Title" />
          <div className="grid grid-cols-2 gap-2">
            <input name="place" maxLength={120} defaultValue={photo.place ?? ""} className="input" placeholder="Place" aria-label="Place" />
            <input name="country" maxLength={100} defaultValue={photo.country ?? ""} className="input" placeholder="Country" aria-label="Country" />
          </div>
          <textarea name="caption" rows={2} maxLength={500} defaultValue={photo.caption ?? ""} className="input" placeholder="Caption" aria-label="Caption" />
          <div className="grid grid-cols-2 gap-2">
            <input name="sortOrder" type="number" min={0} defaultValue={photo.sortOrder} className="input" aria-label="Order" />
            <select name="status" defaultValue={photo.status} className="input" aria-label="Status">
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <ErrorText text={error} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-navy btn-sm">{busy ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => setEditing(false)} className="btn-outline btn-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 p-4">
          <div>
            <p className="font-semibold text-navy-900">{photo.title}</p>
            {place ? <p className="text-xs text-slate-500">{place}</p> : null}
            {photo.caption ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{photo.caption}</p> : null}
          </div>
          <ErrorText text={error} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing(true)} className="btn-outline btn-sm">Edit</button>
            {photo.status == "PUBLISHED" ? (
              <button type="button" disabled={busy} onClick={() => save({ status: "DRAFT" })} className="btn-outline btn-sm">Hide</button>
            ) : (
              <button type="button" disabled={busy} onClick={() => save({ status: "PUBLISHED" })} className="btn-gold btn-sm">Publish</button>
            )}
            <ConfirmAction
              small
              label="Delete"
              title={`Delete "${photo.title}"?`}
              message="The photo is removed from the website for good. Use Hide instead if you may want it back."
              method="DELETE"
              path={`/api/gallery/${photo.id}`}
            />
          </div>
        </div>
      )}
    </li>
  );
}
