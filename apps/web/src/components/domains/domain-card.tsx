import {
  Globe,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  Trash2,
} from "lucide-react";

interface Domain {
  id: string;
  domain: string;
  status: "active" | "failed" | "pending";
  createdAt: string;
}

interface DomainCardProps {
  domain: Domain;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
  isVerifying: boolean;
}

export function DomainCard({
  domain,
  onVerify,
  onDelete,
  isVerifying,
}: DomainCardProps) {
  const getRecordName = (domainName: string) => {
    const parts = domainName.split(".");
    if (parts.length <= 2) return "@";
    return parts.slice(0, parts.length - 2).join(".");
  };

  return (
    <div className="group flex items-center justify-between bg-white/2 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-center gap-4 w-full">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 text-white/40" />
        </div>
        <div className="w-full">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-white">{domain.domain}</h3>
            {domain.status === "active" ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            ) : domain.status === "failed" ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
                <AlertCircle className="w-3 h-3" />
                Failed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-400">
                <AlertCircle className="w-3 h-3" />
                Pending DNS
              </span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-1">
            Added on {new Date(domain.createdAt).toLocaleDateString()}
          </p>
          {domain.status !== "active" && (
            <div className="mt-4 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl shrink-0">
                  <Info className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    DNS Configuration
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Add these records to your domain provider to verify
                    ownership and route traffic. It may take a few minutes for
                    changes to propagate.
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* CNAME Record */}
                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-[60px_1fr_1fr_32px] gap-4 p-2.5 border-b border-white/5 text-[10px] font-medium text-white/40 uppercase tracking-wider">
                    <div>Type</div>
                    <div>Name</div>
                    <div>Value</div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-[60px_1fr_1fr_32px] gap-4 p-3 items-center">
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium ring-1 ring-inset ring-blue-500/20">
                        CNAME
                      </span>
                    </div>
                    <div
                      className="font-mono text-white/80 text-xs truncate"
                      title={getRecordName(domain.domain)}
                    >
                      {getRecordName(domain.domain)}
                    </div>
                    <div
                      className="font-mono text-white/60 text-xs truncate"
                      title="edge.outray.app"
                    >
                      edge.outray.app
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText("edge.outray.app")
                        }
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                        title="Copy value"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* TXT Record */}
                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-[60px_1fr_1fr_32px] gap-4 p-2.5 border-b border-white/5 text-[10px] font-medium text-white/40 uppercase tracking-wider">
                    <div>Type</div>
                    <div>Name</div>
                    <div>Value</div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-[60px_1fr_1fr_32px] gap-4 p-3 items-center">
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium ring-1 ring-inset ring-purple-500/20">
                        TXT
                      </span>
                    </div>
                    <div
                      className="font-mono text-white/80 text-xs truncate"
                      title={
                        getRecordName(domain.domain) === "@"
                          ? "_outray-challenge"
                          : `_outray-challenge.${getRecordName(domain.domain)}`
                      }
                    >
                      {getRecordName(domain.domain) === "@"
                        ? "_outray-challenge"
                        : `_outray-challenge.${getRecordName(domain.domain)}`}
                    </div>
                    <div
                      className="font-mono text-white/60 text-xs truncate"
                      title={domain.id}
                    >
                      {domain.id}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => navigator.clipboard.writeText(domain.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                        title="Copy value"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={() => onVerify(domain.id)}
                  disabled={isVerifying}
                  className="w-full py-2.5 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium disabled:opacity-50 text-sm"
                >
                  {isVerifying
                    ? "Verifying Configuration..."
                    : "Verify DNS Records"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-start">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete this domain?")) {
              onDelete(domain.id);
            }
          }}
          className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-lg transition-colors"
          title="Remove domain"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
