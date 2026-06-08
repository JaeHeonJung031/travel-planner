import { redirect } from "next/navigation";
import { AppShell } from "@/shared/layout/app-shell";
import { Card } from "@/shared/ui/card";
import { auth } from "@/auth";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { DeleteAccountButton } from "@/features/profile/components/delete-account-button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell title="마이페이지">
      <Card className="mb-4">
        <p className="text-sm text-slate-500">로그인 계정</p>
        <p className="font-medium">{session.user.email}</p>
        <p className="text-sm">{session.user.name}</p>
      </Card>
      <ProfileForm />
      <div className="mt-4">
        <SignOutButton />
      </div>
      <DeleteAccountButton />
    </AppShell>
  );
}
