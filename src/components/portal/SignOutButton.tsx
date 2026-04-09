"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  callbackUrl?: string;
};

export default function SignOutButton({
  callbackUrl = "/auth",
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl })}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
