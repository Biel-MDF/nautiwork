import { AreaFrame } from "@/components/Shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AreaFrame role="CANDIDATE">{children}</AreaFrame>;
}
