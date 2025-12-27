import { Globe, X } from "lucide-react";
import { useState } from "react";

interface CreateDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (domain: string) => void;
  isPending: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export function CreateDomainModal({
  isOpen,
  onClose,
  onCreate,
  isPending,
  error,
  setError,
}: CreateDomainModalProps) {
  const [newDomain, setNewDomain] = useState("");

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that it's a subdomain (has at least 3 parts: subdomain.domain.tld)
    const parts = newDomain.trim().split(".");
    if (parts.length < 3) {
      setError(
        "Only subdomains are allowed. Please enter a subdomain like api.myapp.com",
      );
      return;
    }

    // Basic domain validation
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
    if (!domainRegex.test(newDomain.trim())) {
      setError("Please enter a valid domain name");
      return;
    }

    onCreate(newDomain.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#101010] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Add New Domain</h3>
          <button
            onClick={() => {
              onClose();
              setNewDomain("");
            }}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Domain Name
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. api.myapp.com"
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                autoFocus
              />
            </div>
            <p className="mt-2 text-sm text-white/40">
              Only subdomains are allowed (e.g., api.myapp.com, app.example.io).
              Root domains like myapp.com are not supported.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setNewDomain("");
              }}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newDomain || isPending}
              className="px-4 py-2 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Adding..." : "Add Domain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
