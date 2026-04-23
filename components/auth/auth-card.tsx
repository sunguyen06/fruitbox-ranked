import Link from "next/link";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  footerLabel: string;
  footerHref: string;
  footerText: string;
  children: ReactNode;
}

export function AuthCard({
  title,
  description,
  footerLabel,
  footerHref,
  footerText,
  children,
}: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-[720px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(48,30,20,0.9),rgba(30,21,15,0.92))] p-6 shadow-[0_28px_120px_rgba(6,4,18,0.52)] backdrop-blur-xl sm:p-8">
      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto max-w-lg text-sm text-[#f0d7bc] sm:text-base">
            {description}
          </p>
        </div>

        {children}

        <p className="text-center text-sm text-[#f0d7bc]">
          {footerLabel}{" "}
          <Link href={footerHref} className="font-semibold text-[#ffcf8a] transition hover:text-white">
            {footerText}
          </Link>
        </p>
      </div>
    </div>
  );
}
