import { redirect } from "next/navigation";

import { FruitboxRankedLogo } from "@/components/menu/fruitbox-ranked-logo";
import { MenuShell } from "@/components/menu/menu-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getOptionalViewer } from "@/lib/auth-session";

interface SignInPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [viewer, params] = await Promise.all([getOptionalViewer(), searchParams]);

  if (viewer) {
    redirect(params.next ?? "/");
  }

  return (
    <MenuShell connectionStatus={null}>
      <div className="flex flex-col items-center gap-8">
        <FruitboxRankedLogo compact />
        <SignInForm nextPath={params.next ?? "/"} />
      </div>
    </MenuShell>
  );
}
