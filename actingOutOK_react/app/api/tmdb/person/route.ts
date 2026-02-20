import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** Extract IMDB person id (e.g. nm1234567) from URL or raw id */
function parseImdbId(input: string): string | null {
  const trimmed = (input || "").trim();
  const match = trimmed.match(/(?:imdb\.com\/name\/)?(nm\d+)/i);
  return match ? match[1].toLowerCase() : null;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB not configured (TMDB_API_KEY missing)" },
      { status: 503 }
    );
  }

  const imdbInput = request.nextUrl.searchParams.get("imdbId") ?? request.nextUrl.searchParams.get("imdb");
  const imdbId = parseImdbId(imdbInput ?? "");
  if (!imdbId) {
    return NextResponse.json(
      { error: "Invalid or missing imdbId (e.g. nm1234567 or full IMDb URL)" },
      { status: 400 }
    );
  }

  try {
    const headers = { Accept: "application/json" };
    const url = (path: string, params: Record<string, string> = {}) => {
      const p = new URLSearchParams({ api_key: apiKey!, ...params });
      return `${TMDB_BASE}${path}?${p}`;
    };

    const findRes = await fetch(url("/find/" + imdbId, { external_source: "imdb_id" }), { headers });
    if (!findRes.ok) {
      const err = await findRes.text();
      return NextResponse.json(
        { error: `TMDB find failed: ${findRes.status} ${err}` },
        { status: 502 }
      );
    }
    const findData = (await findRes.json()) as { person_results?: { id: number }[] };
    const personResults = findData.person_results ?? [];
    const personId = personResults[0]?.id;
    if (personId == null) {
      return NextResponse.json(
        { error: "No person found on TMDB for this IMDb ID" },
        { status: 404 }
      );
    }

    const [detailsRes, imagesRes, movieCreditsRes, tvCreditsRes] = await Promise.all([
      fetch(url(`/person/${personId}`), { headers }),
      fetch(url(`/person/${personId}/images`), { headers }),
      fetch(url(`/person/${personId}/movie_credits`), { headers }),
      fetch(url(`/person/${personId}/tv_credits`), { headers }),
    ]);

    const details = detailsRes.ok ? ((await detailsRes.json()) as Record<string, unknown>) : null;
    const images = imagesRes.ok ? ((await imagesRes.json()) as { profiles?: { file_path: string; vote_average: number }[] }) : null;
    const movieCredits = movieCreditsRes.ok ? ((await movieCreditsRes.json()) as { cast?: unknown[]; crew?: unknown[] }) : null;
    const tvCredits = tvCreditsRes.ok ? ((await tvCreditsRes.json()) as { cast?: unknown[] }) : null;

    const profilePath = images?.profiles?.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))[0]?.file_path;
    const imageUrl = profilePath ? `${TMDB_IMAGE_BASE}/w342${profilePath}` : null;

    return NextResponse.json({
      personId,
      imdbId,
      details,
      imageUrl,
      movieCredits: movieCredits ?? { cast: [], crew: [] },
      tvCredits: tvCredits ?? { cast: [] },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TMDB request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
