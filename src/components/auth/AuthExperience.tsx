"use client";

import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Building2, Truck, Recycle, TrendingUp, Building, Home } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AppRole,
  ROLE_LABELS,
  getDefaultRouteForRole,
  getRequiredRoleForPath,
} from "@/lib/constants";

type AuthMode = "login" | "signup";

type AuthExperienceProps = {
  initialMode: AuthMode;
  initialRole?: AppRole | null;
  callbackUrl?: string | null;
};

const roles: Array<{
  value: AppRole;
  icon: typeof Building;
  description: string;
}> = [
  { value: "ADMIN", icon: Building, description: "Run the full operation and manage all users." },
  { value: "AGENT", icon: Truck, description: "Handle collections, routes, and landfill intake." },
  { value: "HOUSEHOLD", icon: Home, description: "Request pickups, pay bills, and track impact." },
  { value: "RECYCLER", icon: Recycle, description: "List materials, manage invoices, and follow supply." },
  { value: "INVESTOR", icon: TrendingUp, description: "Monitor returns, opportunities, and site performance." },
  { value: "GOVERNMENT", icon: Building2, description: "Oversee compliance, reports, and district coverage." },
];

const demoAccounts: Record<AppRole, string> = {
  ADMIN: "admin@waste.com",
  AGENT: "agent@waste.com",
  HOUSEHOLD: "household@waste.com",
  RECYCLER: "recycler@waste.com",
  INVESTOR: "investor@waste.com",
  GOVERNMENT: "government@waste.com",
};

export default function AuthExperience({
  initialMode,
  initialRole,
  callbackUrl,
}: AuthExperienceProps) {
  const router = useRouter();
  const requiredRole = callbackUrl ? getRequiredRoleForPath(callbackUrl) : null;
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">(
    requiredRole ?? initialRole ?? "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableRoles = useMemo(() => {
    if (!requiredRole) {
      return roles;
    }

    return roles.filter((role) => role.value === requiredRole);
  }, [requiredRole]);

  const heading =
    mode === "login" ? "Welcome back" : "Create your IsukuHub account";

  const subheading =
    mode === "login"
      ? "Sign in to open your live portal."
      : "Register once and jump straight into the workflow for your role.";

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const finishSignIn = async (role: AppRole) => {
    const session = await getSession();
    const destination = callbackUrl || getDefaultRouteForRole(session?.user?.role ?? role);
    router.push(destination);
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!selectedRole) {
      setError("Choose a role to continue.");
      return;
    }

    if (requiredRole && selectedRole !== requiredRole) {
      setError(`This page needs a ${ROLE_LABELS[requiredRole]} account.`);
      return;
    }

    if (mode === "signup") {
      if (!formData.name.trim()) {
        setError("Enter a name for the new account.");
        return;
      }

      if (formData.password.length < 8) {
        setError("Passwords must be at least 8 characters long.");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role: selectedRole,
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "Registration failed.");
          return;
        }

        setSuccess("Account created. Signing you in now...");
      }

      const result = await signIn("credentials", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: selectedRole,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "signup"
            ? "Account created, but sign-in failed. Please sign in manually."
            : "Invalid credentials. Try one of the seeded demo accounts below.",
        );
        return;
      }

      await finishSignIn(selectedRole);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Authentication failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(160deg,_#f7fbff,_#eef6f2_55%,_#ffffff)] p-4 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-slate-950 px-8 py-10 text-white lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.35),_transparent_30%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 text-white/90">
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <Recycle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-white/65">
                    IsukuHub
                  </p>
                  <p className="text-lg font-semibold">Connected waste intelligence</p>
                </div>
              </Link>

              <h1 className="mt-12 max-w-xl text-4xl font-semibold leading-tight lg:text-5xl">
                Every portal now runs from the same live system.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Households, agents, recyclers, investors, administrators, and government
                teams all land in real database-backed workspaces with working actions.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                  What you get
                </p>
                <p className="mt-3 text-xl font-semibold">Live CRUD flows</p>
                <p className="mt-2 text-sm text-white/70">
                  Create records, update workflows, and follow status changes without mock data.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                  Demo seed
                </p>
                <p className="mt-3 text-xl font-semibold">Ready to explore</p>
                <p className="mt-2 text-sm text-white/70">
                  Use the seeded accounts to move between every major role immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-12">
          <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  resetMessages();
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === "login"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  resetMessages();
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === "signup"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-semibold text-slate-900">{heading}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{subheading}</p>
          </div>

          {requiredRole ? (
            <div className="mt-6 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              You&apos;re opening a protected route that requires the{" "}
              <span className="font-semibold">{ROLE_LABELS[requiredRole]}</span> portal.
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-slate-700">Choose a role</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableRoles.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`rounded-[1.3rem] border p-4 text-left transition-all ${
                      isActive
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-2xl p-2 ${
                          isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {ROLE_LABELS[role.value]}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleFieldChange}
                    placeholder="Jane Doe"
                    required
                    className="w-full rounded-[1.2rem] border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500"
                  />
                </div>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFieldChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-[1.2rem] border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleFieldChange}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                  required
                  className="w-full rounded-[1.2rem] border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            {mode === "signup" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm password
                </span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleFieldChange}
                    placeholder="Repeat your password"
                    required
                    className="w-full rounded-[1.2rem] border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>
            ) : null}

            {error ? (
              <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading || !selectedRole}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Open portal"
                  : "Create account"}
            </button>
          </form>

          <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Seeded demo accounts
            </p>
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.value);
                    setFormData((current) => ({
                      ...current,
                      email: demoAccounts[role.value],
                      password: "demo123",
                    }));
                    setMode("login");
                    resetMessages();
                  }}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{ROLE_LABELS[role.value]}</span>
                  <span className="text-xs text-slate-500">
                    {demoAccounts[role.value]} / demo123
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
