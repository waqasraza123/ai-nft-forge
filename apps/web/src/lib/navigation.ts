export function isAppRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/studio") ||
    pathname.startsWith("/ops") ||
    pathname.startsWith("/sign-in")
  );
}

export const primaryNavigation = [
  {
    href: "/",
    label: "Platform"
  },
  {
    href: "/brands/demo-studio",
    label: "Public launch"
  },
  {
    href: "/studio",
    label: "Studio"
  },
  {
    href: "/ops",
    label: "Ops"
  }
] as const;
