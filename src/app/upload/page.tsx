import { UploadForm } from "./upload-form";

export const metadata = {
  title: "Publish an adapter — Adaptive Minds Marketplace",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-amber">publish</p>
      <h1 className="mt-3 font-mono text-3xl leading-tight text-ivory">Slot in your own module.</h1>
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted">
        Files are pushed straight from your browser to your own Hugging Face repo using{" "}
        <code className="font-mono text-ivory">@huggingface/hub</code> — your write token never
        touches this server. Once the upload finishes, we register the adapter here so it shows
        up in the catalog.
      </p>
      <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-dim">
        You&apos;ll need a Hugging Face{" "}
        <a
          href="https://huggingface.co/settings/tokens"
          target="_blank"
          rel="noreferrer"
          className="text-amber hover:underline"
        >
          write access token
        </a>
        . The repo is created public under your namespace.
      </p>

      <UploadForm />
    </div>
  );
}
