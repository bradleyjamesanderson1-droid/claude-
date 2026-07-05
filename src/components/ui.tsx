import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function PrimaryButton({
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={`rounded-full bg-ink px-7 py-3.5 text-[15px] font-medium text-paper transition-colors duration-200 hover:bg-ink/85 disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function QuietButton({
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={`rounded-full border border-line px-6 py-3 text-[15px] text-ink/80 transition-colors duration-200 hover:border-sage hover:text-ink ${className}`}
      {...props}
    />
  );
}

export function TextField({
  className = "",
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      className={`w-full rounded-xl border border-line bg-white/60 px-4 py-3 text-[15px] outline-none transition-colors duration-200 placeholder:text-ink/35 focus:border-sage ${className}`}
      {...props}
    />
  );
}

export function TextArea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={`w-full resize-none rounded-xl border border-line bg-white/60 px-4 py-3 text-[15px] outline-none transition-colors duration-200 placeholder:text-ink/35 focus:border-sage ${className}`}
      {...props}
    />
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-serif text-lg lowercase tracking-tight">
      undisciplined
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-ink/50">
        <Link href="/privacy" className="hover:text-ink">
          privacy
        </Link>
        <Link href="/terms" className="hover:text-ink">
          terms
        </Link>
        <a href="mailto:hello@undisciplined.co" className="hover:text-ink">
          contact
        </a>
        <span className="ml-auto">an undisciplined system</span>
      </div>
    </footer>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-ink/80">
      {children}
    </div>
  );
}
