import { ReactNode } from "react";
import StatusBadge from "@/components/StatusBadge";
import Tilt from "@/components/Tilt";
import { CatalogueResource } from "@/lib/resources";
import { Item } from "@/lib/types";

// A catalogue listing as the website shows it (photo, name, details, price)
// on a 3D tilt card, plus the publishing status and admin actions.
export default function CatalogueCard({
  resource,
  item,
  actions,
  preview = false,
}: {
  resource: CatalogueResource;
  item: Item;
  actions?: ReactNode;
  preview?: boolean;
}) {
  const card = resource.card(item);
  const title = resource.titleOf(item) || (preview ? `New ${resource.singular}` : "");
  const details = card.details.filter(Boolean).join(" · ");
  const status = typeof item.status == "string" && item.status != "" ? item.status : null;

  return (
    <Tilt className="h-full rounded-2xl">
      <article className={`card group flex h-full flex-col overflow-hidden ${status == "ARCHIVED" ? "opacity-70 saturate-50" : ""}`}>
        <div
          className="relative aspect-4/3 w-full overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${resource.color}, #0b2545)` }}
        >
          {/* Catalogue photos can live on any host, so a plain <img> */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/50 to-transparent" />
          {status && (
            <span className="absolute top-3 right-3 shadow-md">
              <StatusBadge value={status} />
            </span>
          )}
          {card.badge && (
            <span className="badge absolute top-3 left-3 bg-white/95 text-navy-900 shadow-md">{card.badge}</span>
          )}
          {card.eyebrow && (
            <span className="badge absolute bottom-3 left-3 text-white shadow-md" style={{ background: resource.color }}>
              {card.eyebrow}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 font-semibold text-navy-900">{title}</h3>
          {details && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{details}</p>}
          <p className="mt-3 text-lg font-bold text-navy-900">{card.price}</p>
          {actions && <div className="mt-auto flex flex-wrap gap-2 pt-4">{actions}</div>}
        </div>
      </article>
    </Tilt>
  );
}
