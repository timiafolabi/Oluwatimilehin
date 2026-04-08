import { getPersonalizationSnapshot, updateInstantSmsCategories, updateSenderPreference } from "@/services/personalization";

export async function setSenderAsImportant(userId: string, senderEmail: string) {
  return updateSenderPreference(userId, senderEmail, "important");
}

export async function setSenderAsMuted(userId: string, senderEmail: string) {
  return updateSenderPreference(userId, senderEmail, "muted");
}

export async function setInstantSmsCategories(userId: string, categories: string[]) {
  return updateInstantSmsCategories(userId, categories);
}

export async function getPersonalizationSettings(userId: string) {
  return getPersonalizationSnapshot(userId);
}
