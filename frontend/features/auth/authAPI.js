import api from "@/lib/api";

export async function loginWithGoogleToken(idToken) {
  const response = await api.post("/auth/google", { id_token: idToken });
  return response.data;
}

export async function setUserRole(role) {
  const response = await api.post("/auth/set-role", { role });
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function logoutUser() {
  const response = await api.post("/auth/logout");
  return response.data;
}
