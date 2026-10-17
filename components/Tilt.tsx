"use client";

import { PointerEvent, ReactNode, useRef } from "react";

// Wrapper that leans its card toward the mouse (3D tilt plus a light glare).
// Touch and keyboard users get the plain card; styles are .tilt in globals.css.
// Same component as the website's components/site/Tilt.tsx.
export default function Tilt({
  children,
  className = "",
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number; // strongest lean in degrees
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (element == null || event.pointerType != "mouse") {
      return;
    }
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    element.style.setProperty("--rx", `${(0.5 - y) * max}deg`);
    element.style.setProperty("--ry", `${(x - 0.5) * max}deg`);
    element.style.setProperty("--gx", `${x * 100}%`);
    element.style.setProperty("--gy", `${y * 100}%`);
  }

  function onLeave() {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt ${className}`}>
      {children}
      <span className="tilt-glare" aria-hidden="true" />
    </div>
  );
}
