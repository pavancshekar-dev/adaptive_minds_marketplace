"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import { slugify, parseAdapterName, BASE_MODEL_REGISTRY } from "@/lib/adapter-naming";
import { generateAdapterReadme } from "@/lib/generate-readme";

type ConnectStatus = "idle" | "connecting" | "connected" | "error";
type SubmitStatus = "idle" | "uploading" | "registering" | "done" | "error";

const BASE_MODEL_OPTIONS = [...new Set(Object.values(BASE_MODEL_REGISTRY))].filter(
  (m) => m !== "Misc / experimental",
);

export function UploadForm() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");
  const [connectError, setConnectError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoTouched, setRepoTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [baseModel, setBaseModel] = useState(BASE_MODEL_OPTIONS[0]);
  const [domain, setDomain] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const configInputRef = useRef<HTMLInputElement>(null);
  const weightsInputRef = useRef<HTMLInputElement>(null);
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [weightsFile, setWeightsFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [resultSlug, setResultSlug] = useState<string | null>(null);

  async function handleConnect() {
    if (!token.trim()) return;
    setConnectStatus("connecting");
    setConnectError(null);
    try {
      const { whoAmI } = await import("@huggingface/hub");
      const who = await whoAmI({ accessToken: token.trim() });
      if (who.type !== "user" && who.type !== "org") {
        throw new Error("Token is not associated with a user account.");
      }
      setUsername(who.name);
      setConnectStatus("connected");
    } catch (err) {
      setConnectStatus("error");
      setConnectError(err instanceof Error ? err.message : "Could not verify that token.");
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!repoTouched) setRepoName(slugify("adaptive-minds-lora", value));
    if (!domain) {
      const parsed = parseAdapterName(value);
      setDomain(parsed.domain);
    }
  }

  const canSubmit =
    connectStatus === "connected" &&
    username &&
    name.trim() &&
    repoName.trim() &&
    description.trim() &&
    domain.trim() &&
    configFile &&
    weightsFile &&
    submitStatus !== "uploading" &&
    submitStatus !== "registering";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !username) return;

    setSubmitStatus("uploading");
    setSubmitError(null);
    setProgressLabel("Creating repo…");

    try {
      const { createRepo, uploadFilesWithProgress } = await import("@huggingface/hub");
      const repoId = `${username}/${repoName.trim()}`;
      const accessToken = token.trim();
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      try {
        await createRepo({ repo: { type: "model", name: repoId }, accessToken, private: false });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (!/already (created|exists)/i.test(msg)) throw err;
      }

      const weightsPath = weightsFile!.name.endsWith(".bin")
        ? "adapter_model.bin"
        : "adapter_model.safetensors";

      const files: Array<{ path: string; content: Blob }> = [
        { path: "adapter_config.json", content: configFile! },
        { path: weightsPath, content: weightsFile! },
        ...extraFiles.map((f) => ({ path: f.name, content: f as Blob })),
      ];

      if (!extraFiles.some((f) => f.name.toLowerCase() === "readme.md")) {
        files.push({
          path: "README.md",
          content: new Blob(
            [generateAdapterReadme({ name, description, baseModel, domain, tags })],
            { type: "text/markdown" },
          ),
        });
      }

      for await (const event of uploadFilesWithProgress({
        repo: { type: "model", name: repoId },
        files,
        accessToken,
        commitTitle: `Add ${name} via Adaptive Minds Marketplace`,
      })) {
        if (event.event === "phase") {
          setProgressLabel(
            event.phase === "preuploading"
              ? "Preparing upload…"
              : event.phase === "uploadingLargeFiles"
                ? "Uploading weights (this can take a while)…"
                : "Committing…",
          );
        } else {
          setProgressLabel(`Uploading ${event.path} — ${Math.round(event.progress * 100)}%`);
        }
      }

      setSubmitStatus("registering");
      setProgressLabel("Registering in the catalog…");

      const res = await fetch("/api/adapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          systemPrompt: systemPrompt || null,
          baseModel,
          domain,
          method: null,
          tags,
          hfRepoId: repoId,
          hfPath: "",
          uploaderUsername: username,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Registration failed.");

      setResultSlug(json.adapter.slug);
      setSubmitStatus("done");
    } catch (err) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Something went wrong during upload.");
    }
  }

  if (submitStatus === "done" && resultSlug) {
    return (
      <div className="mt-8 rounded-md border border-ok/30 bg-surface p-6">
        <p className="flex items-center gap-2 font-mono text-[13px] text-ok">
          <CheckCircle2 size={16} /> Published.
        </p>
        <p className="mt-2 text-[13.5px] text-muted">
          Your adapter is live on the Hub and in the catalog.
        </p>
        <button
          onClick={() => router.push(`/adapters/${resultSlug}`)}
          className="mt-4 rounded border border-amber/40 bg-amber-soft px-4 py-2 font-mono text-[12px] text-amber transition-colors hover:bg-amber/20"
        >
          view adapter →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
      <fieldset className="rounded-md border border-line bg-surface p-5">
        <legend className="px-1 font-mono text-[11px] uppercase tracking-wider text-dim">
          1. Connect
        </legend>
        <label className="mt-2 block font-mono text-[12px] text-muted">Hugging Face write token</label>
        <div className="mt-2 flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="hf_…"
            autoComplete="off"
            className="flex-1 rounded border border-line bg-graphite px-3 py-2 font-mono text-[13px] text-ivory placeholder:text-dim focus:border-amber focus:outline-none"
          />
          <button
            type="button"
            onClick={handleConnect}
            disabled={!token.trim() || connectStatus === "connecting"}
            className="shrink-0 rounded border border-line-bright px-4 py-2 font-mono text-[12px] text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-40"
          >
            {connectStatus === "connecting" ? <Loader2 size={13} className="animate-spin" /> : "connect"}
          </button>
        </div>
        {connectStatus === "connected" && (
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[12px] text-ok">
            <CheckCircle2 size={13} /> connected as {username}
          </p>
        )}
        {connectStatus === "error" && (
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[12px] text-danger">
            <AlertCircle size={13} /> {connectError}
          </p>
        )}
        <p className="mt-2 text-[11px] text-dim">
          Kept in this tab only — sent straight to huggingface.co, never to our server.
        </p>
      </fieldset>

      <fieldset className="rounded-md border border-line bg-surface p-5">
        <legend className="px-1 font-mono text-[11px] uppercase tracking-wider text-dim">
          2. Describe
        </legend>
        <div className="flex flex-col gap-4">
          <Field label="Adapter name">
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. qwen25-supply-chain-v1"
              className={inputClass}
            />
          </Field>
          <Field label="Repo name" hint={username ? `${username}/${repoName || "…"}` : undefined}>
            <input
              value={repoName}
              onChange={(e) => {
                setRepoTouched(true);
                setRepoName(slugify(e.target.value));
              }}
              placeholder="adaptive-minds-lora-…"
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this adapter good at? What was it trained on?"
              className={cn(inputClass, "resize-none")}
            />
          </Field>
          <Field label="System prompt" hint="optional — used by the Adaptive Minds runtime">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={2}
              placeholder="You are an expert in…"
              className={cn(inputClass, "resize-none")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Base model">
              <select
                value={baseModel}
                onChange={(e) => setBaseModel(e.target.value)}
                className={inputClass}
              >
                {BASE_MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Domain">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. legal"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Tags" hint="comma separated, optional">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="grpo, reasoning"
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-line bg-surface p-5">
        <legend className="px-1 font-mono text-[11px] uppercase tracking-wider text-dim">
          3. Files
        </legend>
        <div className="flex flex-col gap-4">
          <FilePicker
            label="adapter_config.json"
            inputRef={configInputRef}
            file={configFile}
            accept=".json"
            onChange={setConfigFile}
          />
          <FilePicker
            label="adapter weights (.safetensors or .bin)"
            inputRef={weightsInputRef}
            file={weightsFile}
            accept=".safetensors,.bin"
            onChange={setWeightsFile}
          />
          <div>
            <label className="font-mono text-[12px] text-muted">
              Additional files <span className="text-dim">(tokenizer, README, etc. — optional)</span>
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setExtraFiles(Array.from(e.target.files ?? []))}
              className="mt-2 w-full font-mono text-[12px] text-muted file:mr-3 file:rounded file:border file:border-line-bright file:bg-graphite file:px-3 file:py-1.5 file:font-mono file:text-[11px] file:text-muted"
            />
          </div>
        </div>
      </fieldset>

      {submitError && (
        <p className="flex items-center gap-1.5 font-mono text-[12px] text-danger">
          <AlertCircle size={13} /> {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 rounded-md border border-amber/40 bg-amber-soft py-3 font-mono text-[13px] text-amber transition-colors hover:bg-amber/20 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {submitStatus === "uploading" || submitStatus === "registering" ? (
          <>
            <Loader2 size={15} className="animate-spin" /> {progressLabel ?? "Working…"}
          </>
        ) : (
          <>
            <UploadCloud size={15} /> publish to hugging face
          </>
        )}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded border border-line bg-graphite px-3 py-2 font-mono text-[13px] text-ivory placeholder:text-dim focus:border-amber focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-[12px] text-muted">{label}</label>
        {hint && <span className="font-mono text-[11px] text-dim">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FilePicker({
  label,
  file,
  accept,
  inputRef,
  onChange,
}: {
  label: string;
  file: File | null;
  accept: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label className="font-mono text-[12px] text-muted">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded border border-line-bright px-3 py-2 font-mono text-[12px] text-muted transition-colors hover:border-amber hover:text-amber"
        >
          choose file
        </button>
        <span className="truncate font-mono text-[12px] text-dim">
          {file ? `${file.name} · ${(file.size / 1e6).toFixed(1)} MB` : "no file selected"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="hidden"
      />
    </div>
  );
}
