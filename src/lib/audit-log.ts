import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata as Prisma.InputJsonObject | undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed:", error);
  }
}
