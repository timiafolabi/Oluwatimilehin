import { trackPersonalizationSignal } from "@/services/personalization";

export async function trackAlertClicked(userId: string, emailId: string) {
  return trackPersonalizationSignal(userId, "alert_clicked", { source: "dashboard" }, emailId);
}

export async function trackAlertIgnored(userId: string, emailId: string) {
  return trackPersonalizationSignal(userId, "alert_ignored", { source: "dashboard" }, emailId);
}

export async function trackImportanceOverride(userId: string, emailId: string, nextClass: string) {
  return trackPersonalizationSignal(userId, "importance_overridden", { nextClass }, emailId);
}
