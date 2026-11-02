import type { APIRoute } from "astro";
import { confirmSubscriber, readToken } from "../../lib/newsletter";

export const prerender = false;

/** GET ?token= from the confirm email → add the contact, then land on a status page. */
export const GET: APIRoute = async ({ url, redirect }) => {
  const parsed = readToken(url.searchParams.get("token") ?? "");
  if ("error" in parsed) return redirect(`/newsletter/confirmed?status=${parsed.error}`, 303);

  try {
    await confirmSubscriber(parsed.email, parsed.list);
  } catch (err) {
    console.error("[newsletter] confirm failed:", err);
    return redirect("/newsletter/confirmed?status=error", 303);
  }
  return redirect(`/newsletter/confirmed?status=ok&list=${parsed.list}`, 303);
};
