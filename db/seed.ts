import { prisma } from "./client";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { phoneNumber: "+15551230000" },
    create: { email: "demo@example.com", phoneNumber: "+15551230000" }
  });

  const gmail = await prisma.connectedAccount.upsert({
    where: {
      userId_provider_accountEmail: {
        userId: user.id,
        provider: "gmail",
        accountEmail: "founder@gmail.com"
      }
    },
    update: { status: "connected", notificationsOn: true, draftingEnabled: true, autoActionsEnabled: false },
    create: {
      userId: user.id,
      provider: "gmail",
      accountEmail: "founder@gmail.com",
      accessToken: "mock-gmail-access",
      refreshToken: "mock-gmail-refresh",
      status: "connected",
      notificationsOn: true,
      draftingEnabled: true,
      autoActionsEnabled: false
    }
  });


  const outlook = await prisma.connectedAccount.upsert({
    where: {
      userId_provider_accountEmail: {
        userId: user.id,
        provider: "outlook",
        accountEmail: "ops@outlook.com"
      }
    },
    update: { status: "connected", notificationsOn: true, draftingEnabled: true, autoActionsEnabled: false },
    create: {
      userId: user.id,
      provider: "outlook",
      accountEmail: "ops@outlook.com",
      accessToken: "mock-outlook-access",
      refreshToken: "mock-outlook-refresh",
      status: "connected",
      notificationsOn: true,
      draftingEnabled: true,
      autoActionsEnabled: false
    }
  });

  await prisma.userRule.upsert({
    where: { id: "demo-rule" },
    update: {},
    create: {
      id: "demo-rule",
      userId: user.id,
      autoHandleLowRisk: true,
      importantSenders: ["ceo@keyclient.com"],
      mutedSenders: ["noreply@promo.example.com"],
      instantSmsCategories: ["urgent", "important"],
      ignoredPatterns: ["weekly newsletter"],
      approvalCategories: ["legal", "financial", "medical", "school", "recruiting", "security"]
    }
  });

  await prisma.normalizedEmail.upsert({
    where: { id: "demo-email-1" },
    update: {},
    create: {
      id: "demo-email-1",
      userId: user.id,
      accountId: gmail.id,
      provider: "gmail",
      threadId: "thread-1",
      senderName: "Key Client",
      senderEmail: "ceo@keyclient.com",
      recipients: ["founder@gmail.com"],
      subject: "Urgent: contract redline needed today",
      bodyText: "Need legal review before 5 PM.",
      bodyHtml: "<p>Need legal review before 5 PM.</p>",
      receivedAt: new Date(),
      labels: ["INBOX"],
      attachments: [],
      rawImportance: 0.92,
      triageClass: "urgent",
      aiSummary: "Client requests contract redline by 5 PM.",
      aiActionItems: ["Review redline", "Reply with ETA"],
      aiDeadline: "today",
      aiDraftReply: "Thanks, we'll review and return comments by 4 PM.",
      riskLevel: "high",
      riskCategories: ["legal"],
      requiresApproval: true,
      confidence: 0.91,
      status: "needs_approval"
    }
  });


  await prisma.normalizedEmail.upsert({
    where: { id: "demo-email-2" },
    update: {},
    create: {
      id: "demo-email-2",
      userId: user.id,
      accountId: outlook.id,
      provider: "outlook",
      threadId: "thread-2",
      senderName: "Shipping Bot",
      senderEmail: "updates@shipper.com",
      recipients: ["ops@outlook.com"],
      subject: "Package delivered",
      bodyText: "Your shipment has been delivered.",
      bodyHtml: "<p>Your shipment has been delivered.</p>",
      receivedAt: new Date(),
      labels: ["INBOX"],
      attachments: [],
      rawImportance: 0.25,
      triageClass: "low_priority",
      aiSummary: "Shipping confirmation.",
      aiActionItems: ["No response needed"],
      aiDeadline: null,
      aiDraftReply: null,
      riskLevel: "low",
      riskCategories: [],
      requiresApproval: false,
      confidence: 0.88,
      status: "triaged"
    }
  });

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
