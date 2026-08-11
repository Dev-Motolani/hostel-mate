export const SESSION_EXPIRED = "SESSION_EXPIRED";

export function clearSession() {
  localStorage.removeItem("hostel_mate_access_token");
  localStorage.removeItem("hostel_mate_refresh_token");
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const requestWithToken = (accessToken: string) => {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(url, { ...options, headers });
  };
  const accessToken = localStorage.getItem("hostel_mate_access_token");
  if (!accessToken) throw new Error(SESSION_EXPIRED);

  let response = await requestWithToken(accessToken);
  if (response.status !== 401) return response;

  const refreshToken = localStorage.getItem("hostel_mate_refresh_token");
  if (!refreshToken) {
    clearSession();
    throw new Error(SESSION_EXPIRED);
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
  const refreshResponse = await fetch(`${apiUrl}/auth/token/refresh/`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!refreshResponse.ok) {
    clearSession();
    throw new Error(SESSION_EXPIRED);
  }
  const tokens = await refreshResponse.json();
  localStorage.setItem("hostel_mate_access_token", tokens.access);
  return requestWithToken(tokens.access);
}
