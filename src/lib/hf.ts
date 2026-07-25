// Thin helpers around the public Hugging Face Hub HTTP API. All of these hit
// public, unauthenticated endpoints — no token is ever handled on the server.
// The upload flow's write token stays entirely in the browser (see UploadForm).

export const HF_API = "https://huggingface.co";

export type HfTreeEntry = {
  type: "file" | "directory";
  oid: string;
  size: number;
  path: string;
};

/** Fetches the full recursive file tree of a model repo, following pagination. */
export async function fetchRepoTree(repoId: string, revision = "main"): Promise<HfTreeEntry[]> {
  const entries: HfTreeEntry[] = [];
  let url: string | null =
    `${HF_API}/api/models/${repoId}/tree/${revision}?recursive=true&expand=false`;

  while (url) {
    const res: Response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`HF tree fetch failed for ${repoId}: ${res.status} ${res.statusText}`);
    }
    const page = (await res.json()) as HfTreeEntry[];
    entries.push(...page);

    const link = res.headers.get("link");
    const match = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = match ? match[1] : null;
  }

  return entries;
}

/** Fetches and JSON-parses a single raw file from a repo. Returns null on 404. */
export async function fetchRepoJsonFile<T = unknown>(
  repoId: string,
  path: string,
  revision = "main",
): Promise<T | null> {
  const res = await fetch(`${HF_API}/${repoId}/raw/${revision}/${path}`);
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Fetches a single raw text file from a repo. Returns null on 404. */
export async function fetchRepoTextFile(
  repoId: string,
  path: string,
  revision = "main",
): Promise<string | null> {
  const res = await fetch(`${HF_API}/${repoId}/raw/${revision}/${path}`);
  if (!res.ok) return null;
  return res.text();
}

/** True if a public model repo exists and is reachable. */
export async function repoExists(repoId: string): Promise<boolean> {
  const res = await fetch(`${HF_API}/api/models/${repoId}`, { method: "GET" });
  return res.ok;
}

export type LoraAdapterConfig = {
  r?: number;
  lora_alpha?: number;
  lora_dropout?: number;
  target_modules?: string[];
  base_model_name_or_path?: string;
  task_type?: string;
};
