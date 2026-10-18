type ApiEnvelope<T> = {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function buildUrl(endpoint: string): string {
  const normalizedBase = BASE_URL.replace(/\/$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (normalizedBase.endsWith("/api") && normalizedEndpoint.startsWith("/api/")) {
    return `${normalizedBase}${normalizedEndpoint.replace(/^\/api/, "")}`;
  }

  return `${normalizedBase}${normalizedEndpoint}`;
}

export async function fetchWebData<T>(endpoint: string): Promise<T> {
  const response = await fetch(buildUrl(endpoint), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const rawBody = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  try {
    payload = JSON.parse(rawBody) as ApiEnvelope<T>;
  } catch {
    throw new Error(
      `Invalid response from server (status ${response.status}). Check NEXT_PUBLIC_API_URL and backend route availability.`,
    );
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Failed to fetch data (status ${response.status})`);
  }

  return payload.data;
}
