import { Landing } from "@/components/landing";

async function CachedLanding() {
  "use cache";
  return <Landing />;
}

export default function Page() {
  return <CachedLanding />;
}
