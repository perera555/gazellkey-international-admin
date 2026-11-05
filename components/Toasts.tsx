"use client";

import { Toaster } from "react-hot-toast";

// Pop-up messages on every admin page ("Tour saved", "Could not save ...").
// Call toast.success("...") / toast.error("...") from react-hot-toast in any
// client component; saves that reload the page pass ?notice= (FlashNotice).
export default function Toasts() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ top: 72 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0b1530",
          color: "#ffffff",
          borderRadius: "14px",
          padding: "10px 16px",
          fontSize: "14px",
          fontWeight: 500,
          boxShadow: "0 18px 40px -18px rgba(6, 11, 26, 0.75)",
        },
        success: { iconTheme: { primary: "#d4a64a", secondary: "#0b1530" } },
        error: { duration: 6000, iconTheme: { primary: "#ef4444", secondary: "#ffffff" } },
      }}
    />
  );
}
