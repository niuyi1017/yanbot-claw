import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guard";
import { AppHeader } from "@/components/layout/app-header";
import { AppSider } from "@/components/layout/app-sider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader username={user.username} />
      <div className="flex flex-1">
        <AppSider />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
