// lib/auth.js

import { serverApi } from "./serverApi";

export async function getCurrentUser() {
  try {
    return await serverApi("/auth/me");
  } catch {
    return null;
  }
}