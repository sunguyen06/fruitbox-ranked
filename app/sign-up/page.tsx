import { redirect } from "next/navigation";

import { FruitboxRankedLogo } from "@/components/menu/fruitbox-ranked-logo";
import { MenuShell } from "@/components/menu/menu-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getOptionalViewer } from "@/lib/auth-session";

interface SignUpPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const [viewer, params] = await Promise.all([getOptionalViewer(), searchParams]);

  if (viewer) {
    redirect(params.next ?? "/");
  }

  return (
    <MenuShell connectionStatus={null}>
      <div className="flex flex-col items-center gap-8">
        <FruitboxRankedLogo compact />
        <SignUpForm nextPath={params.next ?? "/"} />
      </div>
    </MenuShell>
  );
}
