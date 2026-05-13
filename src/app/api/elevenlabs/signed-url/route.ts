import { NextResponse } from "next/server";

/**
 * Proxies ElevenLabs credentials: returns a short-lived signed WebSocket URL
 * for a private Conversational AI agent. Never expose XI_API_KEY to the client.
 */
export async function GET() {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      {
        error:
          "Set ELEVENLABS_AGENT_ID and ELEVENLABS_API_KEY on the server, or use NEXT_PUBLIC_ELEVENLABS_AGENT_ID for a public agent.",
      },
      { status: 500 },
    );
  }

  const url = new URL(
    "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url",
  );
  url.searchParams.set("agent_id", agentId);

  const upstream = await fetch(url.toString(), {
    headers: { "xi-api-key": apiKey },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: text || "ElevenLabs signed URL request failed" },
      { status: upstream.status },
    );
  }

  const body = (await upstream.json()) as { signed_url?: string };
  if (!body.signed_url) {
    return NextResponse.json(
      { error: "signed_url missing from ElevenLabs response" },
      { status: 502 },
    );
  }

  return NextResponse.json({ signedUrl: body.signed_url });
}
