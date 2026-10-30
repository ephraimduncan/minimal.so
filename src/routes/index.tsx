import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing";

export const Route = createFileRoute("/")({
  loader: () => ({ renderedAt: Date.now() }),
  component: Home,
});

function Home() {
  const { renderedAt } = Route.useLoaderData();

  return <Landing renderedAt={renderedAt} />;
}
