import notificationService from "../service/notification.service";

export const getNotifications = async (params) =>
  await notificationService.getNotifications(params);

export const markNotificationRead = async (id) =>
  await notificationService.markNotificationRead(id);

export const markAllNotificationsSeen = async () =>
  await notificationService.markAllNotificationsSeen();

export const getUnseenNotificationCount = async () =>
  await notificationService.getUnseenCount();
