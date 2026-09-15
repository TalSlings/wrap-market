import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RootRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const source = await searchParams;
  const target = new URLSearchParams();

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      for (const item of value) target.append(key, item);
    } else if (value !== undefined) {
      target.set(key, value);
    }
  }

  const query = target.toString();
  redirect(query ? `/market?${query}` : "/market");
}
