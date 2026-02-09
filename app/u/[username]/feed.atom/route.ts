import { generateFeedResponse } from "../feed-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  return generateFeedResponse(request, username, "atom");
}
