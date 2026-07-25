// lib/auth.js

import { serverApi } from "./serverAPI";

export async function getCurrentUser() {
  try {
    return await serverApi("/auth/me");
  } catch {
    return null;
  }
}