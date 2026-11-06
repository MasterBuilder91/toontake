export function checkAccess(req: Request): Response | null {
  const code = Netlify.env.get("ACCESS_CODE")
  const got = req.headers.get("x-access-code") || ""
  if (!code || got !== code) return Response.json({ error: "Wrong or missing access code." }, { status: 401 })
  return null
}

export async function claude(body: Record<string, unknown>): Promise<string> {
  const key = Netlify.env.get("ANTHROPIC_API_KEY")
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set in Netlify environment variables.")
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Claude API error ${res.status}`)
  return (data.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
}

export function extractJSON(text: string): any {
  const a = text.indexOf("{"), b = text.lastIndexOf("}")
  if (a < 0 || b < a) throw new Error("No JSON in model reply")
  return JSON.parse(text.slice(a, b + 1))
}
