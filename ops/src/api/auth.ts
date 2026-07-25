import client from "./client";
import type { LoginResponse } from "./types";

export async function loginStaff(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>("/auth/staff/login", {
    email,
    password,
  });
  return data;
}
