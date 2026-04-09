import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("mode", "signup");

  const role = readString(params.role);
  const callbackUrl = readString(params.callbackUrl);

  if (role) {
    query.set("role", role);
  }

  if (callbackUrl) {
    query.set("callbackUrl", callbackUrl);
  }

  redirect(`/auth?${query.toString()}`);
}
