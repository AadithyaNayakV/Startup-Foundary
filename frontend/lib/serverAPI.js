import axios from "axios";
import { cookies } from "next/headers";

export async function serverApi(path, options = {}) {
  const cookieStore = cookies();
  // Safely grab ONLY the 'session' cookie
  const sessionCookie = cookieStore.get("session")?.value; 

  const res = await axios({
    url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`,
    method: options.method || 'GET',
    data: options.data || null,
    headers: {
      ...options.headers,
      // If the cookie exists, format it exactly how browsers do
      ...(sessionCookie ? { Cookie: `session=${sessionCookie}` } : {}),
    },
  });

  return res.data;
}