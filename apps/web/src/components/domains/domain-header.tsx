import { Plus } from "lucide-react";

interface DomainHeaderProps {
  currentDomainCount: number;
  domainLimit: number;
  isUnlimited: boolean;
  isAtLimit: boolean;
  onAddClick: () => void;
}

export function DomainHeader({
  currentDomainCount,
  domainLimit,
  isUnlimited,
  isAtLimit,
  onAddClick,
}: DomainHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-white">Custom Domains</h1>
        <p className="text-white/40 mt-1">
          Connect your own domains to your tunnels · {currentDomainCount} /{" "}
          {isUnlimited ? "∞" : domainLimit} domains
        </p>
      </div>
      <button
        onClick={onAddClick}
        disabled={isAtLimit}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
          isAtLimit
            ? "bg-white/10 text-gray-400 cursor-not-allowed"
            : "bg-white text-black hover:bg-white/90"
        }`}
      >
        <Plus className="w-4 h-4" />
        Add Domain
      </button>
    </div>
  );
}
