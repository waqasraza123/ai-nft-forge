import type { ReactNode } from "react";

import { requireStudioSession } from "../../../server/auth/guard";

type StudioLayoutProps = {
  children: ReactNode;
};

export default async function StudioLayout({ children }: StudioLayoutProps) {
  await requireStudioSession();

  return children;
}
