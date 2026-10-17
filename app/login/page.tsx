import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";
import LoginForm from "@/app/login/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next == "string" ? params.next : "/";
  const notStaff = params.error == "not-staff";

  return (
    <main className="scene grid min-h-screen place-items-center px-4 py-12">
      <div className="grid-floor" aria-hidden="true" />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-24 w-24 place-items-center rounded-3xl bg-white shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)]">
            <LogoMark className="h-14 w-18" />
          </span>
          <p className="text-3d mt-5 text-2xl font-extrabold tracking-[0.14em]">GAZELLE KEY</p>
          <p className="text-gold-gradient mt-1 text-xs font-semibold tracking-[0.3em]">ADMIN PORTAL</p>
        </div>
        <div className="glass rise p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Staff sign in</h1>
          <p className="mt-1 mb-6 text-sm text-white/70">For Gazellekey staff, finance and administrators.</p>
          <LoginForm next={next} initialError={notStaff ? "This portal is for staff accounts only." : undefined} />
        </div>
      </div>
    </main>
  );
}
