import axios from "axios";
import { cookies } from "next/headers";

export async function serverApi(path) {
  const cookieStore = cookies();
  const cookie = cookieStore.toString();

  const res = await axios.get(`http://localhost:8000${path}`, {
    headers: {
      Cookie: cookie,
    },
  });

  return res.data;
}