import { prisma } from "@/db/client";

export async function trackLearningSignal(userId: string, signalType: string, payload: object, emailId?: string) {
  return prisma.learningSignal.create({
    data: {
      userId,
      emailId,
      signalType,
      payload: payload as never
    }
  });
}
