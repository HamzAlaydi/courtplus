import client from "./client";
import type { AppNotification, Paginated } from "./types";

export async function listNotifications(params?: {
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AppNotification>> {
  const { data } = await client.get("/notifications", { params });
  return data;
}

export async function getUnseenCount(): Promise<number> {
  const { data } = await client.get<{ count: number }>("/notifications/unseen-count");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await client.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsSeen(): Promise<void> {
  await client.post("/notifications/mark-seen");
}

/** One request instead of a PATCH per item. */
export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await client.patch<{ updated: number }>("/notifications/read-all");
  return data;
}
