import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function AppPageLayout({
  children,
  className,
}: PropsWithChildren<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>) {
  return (
    <div className={clsx("px-4 py-6 sm:px-6 lg:px-8 lg:py-10", className)}>
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </div>
  );
}
