import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePageRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requirePageRole("admin");
  const appUrl = process.env.APP_BASE_URL || "";
  const isLiveServer = Boolean(appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1"));
  return <PortalShell role="admin" userName={user.name} isLiveServer={isLiveServer}>{children}</PortalShell>;
}
