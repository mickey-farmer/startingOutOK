/** Single credit row: Project Name | Character/Role | Director/Studio */
export type CreditRow = {
  projectName: string;
  characterOrRole: string;
  directorOrStudio: string;
};

export type CreditsByCategory = {
  film?: CreditRow[];
  theatre?: CreditRow[];
  training?: CreditRow[];
};

export type CastEntry = {
  id: string;
  name: string;
  pronouns?: string | null;
  description?: string | null;
  location?: string | null;
  link?: string | null;
  contactLink?: string | null;
  contactLabel?: string | null;
  email?: string | null;
  instagram?: string | null;
  otherLinks?: { label: string; url: string }[] | null;
  pills?: string[];
  /** Optional link to TMDB person (from "Search TMDB" in admin) */
  tmdbPersonId?: number | null;
  /** Photo URL or path (e.g. /images/cast/id.jpg). Preferred over TMDB image on profile. */
  photoUrl?: string | null;
  /** Manually entered credits. Displayed on profile by category. */
  credits?: CreditsByCategory | null;
};

export type DirectoryData = Record<string, CastEntry[]>;
