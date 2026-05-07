const graphVersion = "v20.0";
const graphBase = `https://graph.facebook.com/${graphVersion}`;

type GraphPage = {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
};

type SyncedMetaMessage = {
  source: "FACEBOOK" | "INSTAGRAM";
  externalId: string;
  threadId: string;
  sourceProfileId: string | null;
  fromName: string | null;
  fromAddress: string | null;
  avatarUrl: string | null;
  subject: string | null;
  body: string;
  lastMessageAt: Date;
};

function getUserToken() {
  return process.env.META_USER_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN || "";
}

async function graphGet<T>(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${graphBase}${path}`);
  url.searchParams.set("access_token", token);

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || "Meta Graph request failed.";
    throw new Error(message);
  }

  return data as T;
}

async function graphPost<T>(path: string, token: string, body: Record<string, unknown>) {
  const url = new URL(`${graphBase}${path}`);
  url.searchParams.set("access_token", token);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || "Meta Graph request failed.";
    throw new Error(message);
  }

  return data as T;
}

async function resolvePage() {
  const userToken = getUserToken();

  if (!userToken) {
    return { ok: false as const, error: "Meta token is not configured." };
  }

  if (process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN && process.env.META_PAGE_ACCESS_TOKEN !== userToken) {
    return {
      ok: true as const,
      page: {
        id: process.env.META_PAGE_ID,
        access_token: process.env.META_PAGE_ACCESS_TOKEN
      } as GraphPage,
      token: process.env.META_PAGE_ACCESS_TOKEN
    };
  }

  const pages = await graphGet<{ data?: GraphPage[] }>("/me/accounts", userToken, {
    fields: "id,name,access_token,instagram_business_account{id,username,profile_picture_url}"
  });

  const page =
    pages.data?.find((candidate) => candidate.id === process.env.META_PAGE_ID) ||
    pages.data?.find((candidate) => candidate.instagram_business_account?.id === process.env.META_INSTAGRAM_BUSINESS_ID) ||
    pages.data?.[0];

  if (!page?.id || !page.access_token) {
    return { ok: false as const, error: "No Meta page with messaging access was found for this token." };
  }

  return { ok: true as const, page, token: page.access_token };
}

function pickExternalParticipant(conversation: any, pageId: string, instagramId?: string) {
  const participants = conversation.participants?.data || [];
  return participants.find((item: any) => item.id !== pageId && item.id !== instagramId) || participants[0] || null;
}

function latestMessage(conversation: any) {
  const messages = conversation.messages?.data || [];
  return messages
    .slice()
    .sort((a: any, b: any) => new Date(b.created_time || 0).getTime() - new Date(a.created_time || 0).getTime())[0];
}

function normalizeConversation(source: "FACEBOOK" | "INSTAGRAM", conversation: any, page: GraphPage): SyncedMetaMessage | null {
  const instagramId = page.instagram_business_account?.id || process.env.META_INSTAGRAM_BUSINESS_ID;
  const participant = pickExternalParticipant(conversation, page.id, instagramId);
  const latest = latestMessage(conversation);

  if (!conversation.id || !latest) {
    return null;
  }

  return {
    source,
    externalId: conversation.id,
    threadId: conversation.id,
    sourceProfileId: participant?.id || latest.from?.id || null,
    fromName: participant?.name || participant?.username || latest.from?.name || source,
    fromAddress: null,
    avatarUrl: participant?.profile_pic || participant?.profile_picture_url || page.instagram_business_account?.profile_picture_url || null,
    subject: source === "INSTAGRAM" ? "Instagram conversation" : "Facebook conversation",
    body: latest.message || latest.text || "(No message body)",
    lastMessageAt: new Date(latest.created_time || conversation.updated_time || Date.now())
  };
}

async function fetchConversations(source: "FACEBOOK" | "INSTAGRAM", page: GraphPage, token: string) {
  const params: Record<string, string> = {
    limit: "25",
    fields: "id,updated_time,participants,messages.limit(8){id,created_time,from,to,message}"
  };

  if (source === "INSTAGRAM") {
    params.platform = "instagram";
  }

  const data = await graphGet<{ data?: any[] }>(`/${page.id}/conversations`, token, params);

  return (data.data || [])
    .map((conversation) => normalizeConversation(source, conversation, page))
    .filter(Boolean) as SyncedMetaMessage[];
}

export async function syncMetaInbox() {
  const resolved = await resolvePage().catch((error) => ({
    ok: false as const,
    error: error instanceof Error ? error.message : "Meta page discovery failed."
  }));

  if (!resolved.ok) {
    return { ok: false, error: resolved.error, messages: [] as SyncedMetaMessage[] };
  }

  const messages: SyncedMetaMessage[] = [];
  const errors: string[] = [];

  try {
    messages.push(...(await fetchConversations("FACEBOOK", resolved.page, resolved.token)));
  } catch (error) {
    errors.push(`Facebook: ${error instanceof Error ? error.message : "sync failed"}`);
  }

  const instagramId = process.env.META_INSTAGRAM_BUSINESS_ID || resolved.page.instagram_business_account?.id;
  if (instagramId) {
    try {
      messages.push(...(await fetchConversations("INSTAGRAM", resolved.page, resolved.token)));
    } catch (error) {
      errors.push(`Instagram: ${error instanceof Error ? error.message : "sync failed"}`);
    }
  }

  return { ok: errors.length === 0 || messages.length > 0, messages, errors };
}

export async function sendMetaReply(input: {
  source: string;
  sourceProfileId: string | null;
  body: string;
}) {
  const resolved = await resolvePage().catch((error) => ({
    ok: false as const,
    error: error instanceof Error ? error.message : "Meta page discovery failed."
  }));

  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  if (!input.sourceProfileId) {
    return { ok: false, error: "Missing recipient profile ID for this conversation." };
  }

  try {
    if (input.source === "INSTAGRAM") {
      const instagramId = process.env.META_INSTAGRAM_BUSINESS_ID || resolved.page.instagram_business_account?.id;
      if (!instagramId) {
        return { ok: false, error: "Instagram business account ID is not configured." };
      }

      await graphPost(`/${instagramId}/messages`, resolved.token, {
        recipient: { id: input.sourceProfileId },
        message: { text: input.body }
      });
    } else {
      await graphPost(`/${resolved.page.id}/messages`, resolved.token, {
        recipient: { id: input.sourceProfileId },
        messaging_type: "RESPONSE",
        message: { text: input.body }
      });
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to send Meta reply." };
  }
}
