import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/auth";
import { Octokit } from "@octokit/rest";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO; // "owner/repo"
  const pathPrefix = process.env.GITHUB_PATH_PREFIX || ""; // e.g. "actingOutOK_react" if repo root is parent

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: "GitHub not configured (GITHUB_TOKEN, GITHUB_REPO)" },
      { status: 503 }
    );
  }

  const [owner, repo] = githubRepo.split("/");
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "GITHUB_REPO must be owner/repo" },
      { status: 503 }
    );
  }

  let body: { path: string; content?: string; message: string; imageBase64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { path: filePath, content, message, imageBase64 } = body;
  if (!filePath || !message) {
    return NextResponse.json(
      { error: "path and message are required" },
      { status: 400 }
    );
  }
  const hasContent = content !== undefined && content !== null;
  const hasImage = typeof imageBase64 === "string" && imageBase64.length > 0;
  if (!hasContent && !hasImage) {
    return NextResponse.json(
      { error: "Either content or imageBase64 is required" },
      { status: 400 }
    );
  }

  const repoPath = pathPrefix ? `${pathPrefix}/${filePath}`.replace(/\/+/g, "/") : filePath;

  const octokit = new Octokit({ auth: githubToken });

  const contentBase64 = hasImage
    ? imageBase64!
    : Buffer.from(content!, "utf8").toString("base64");

  try {
    const branch = process.env.GITHUB_BRANCH || undefined;
    const { data: existing } = await octokit.repos.getContent({
      owner,
      repo,
      path: repoPath,
      ...(branch ? { ref: branch } : {}),
    }).catch(() => ({ data: null }));

    const fileSha = existing && !Array.isArray(existing) ? existing.sha : undefined;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: repoPath,
      message,
      content: contentBase64,
      ...(fileSha ? { sha: fileSha } : {}),
      ...(branch ? { branch } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "GitHub API error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
