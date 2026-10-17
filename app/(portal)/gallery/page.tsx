import type { Metadata } from "next";
import { GalleryCard, GalleryUpload } from "@/components/GalleryManager";
import PageHeader, { ErrorNotice } from "@/components/PageHeader";
import { DIVISION_COLOURS } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";
import { GalleryPhoto } from "@/lib/types";

export const metadata: Metadata = { title: "Travel gallery" };

// Photos shown in the gallery on the website's Travel page and /gallery
export default async function GalleryPage() {
  const result = await apiGet<GalleryPhoto[]>("/api/gallery?division=TRAVEL&all=true&pageSize=100");
  const published = result.ok ? result.data.filter((photo) => photo.status == "PUBLISHED").length : 0;

  return (
    <>
      <PageHeader
        eyebrow="Website"
        title="Travel gallery"
        description="Photos from past trips, shown on the website's Travel page and gallery. Lower order numbers come first."
        color={DIVISION_COLOURS.TRAVEL}
        actions={
          result.ok ? (
            <span className="badge bg-white/15 text-white">
              {published} of {result.data.length} published
            </span>
          ) : undefined
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-navy-900">Add a photo</h2>
        <GalleryUpload />
      </section>

      {result.ok ? (
        result.data.length == 0 ? (
          <p className="card px-6 py-12 text-center text-sm text-slate-500">No photos yet. Add the first one above.</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {result.data.map((photo) => (
              <GalleryCard key={photo.id} photo={photo} />
            ))}
          </ul>
        )
      ) : (
        <ErrorNotice message={result.message} />
      )}
    </>
  );
}
