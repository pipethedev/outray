import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Globe } from "lucide-react";
import { appClient } from "../../lib/app-client";
import { useAppStore } from "../../lib/store";
import { getPlanLimits } from "../../lib/subscription-plans";
import axios from "axios";
import { DomainHeader } from "../../components/domains/domain-header";
import { DomainLimitWarning } from "../../components/domains/domain-limit-warning";
import { CreateDomainModal } from "../../components/domains/create-domain-modal";
import { DomainCard } from "../../components/domains/domain-card";

export const Route = createFileRoute("/dash/domains")({
  component: DomainsView,
});

function DomainsView() {
  const { selectedOrganizationId } = useAppStore();
  const activeOrgId = selectedOrganizationId;
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery(
    {
      queryKey: ["subscription", activeOrgId],
      queryFn: async () => {
        if (!activeOrgId) return null;
        const response = await axios.get(`/api/subscriptions/${activeOrgId}`);
        return response.data;
      },
      enabled: !!activeOrgId,
    },
  );

  const { data, isLoading: isLoadingDomains } = useQuery({
    queryKey: ["domains", activeOrgId],
    queryFn: () => {
      if (!activeOrgId) throw new Error("No active organization");
      return appClient.domains.list(activeOrgId);
    },
    enabled: !!activeOrgId,
  });

  const isLoading = isLoadingDomains || isLoadingSubscription;

  const createMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (!activeOrgId) throw new Error("No active organization");
      return appClient.domains.create({
        domain,
        organizationId: activeOrgId,
      });
    },
    onSuccess: (data) => {
      if ("error" in data) {
        setError(data.error);
      } else {
        setIsCreating(false);
        queryClient.invalidateQueries({ queryKey: ["domains"] });
      }
    },
    onError: () => {
      setError("Failed to create domain");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return appClient.domains.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      return appClient.domains.verify(id);
    },
    onSuccess: (data) => {
      if ("error" in data) {
        alert(data.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["domains"] });
      }
    },
  });

  const domains = data && "domains" in data ? data.domains : [];
  const subscription = subscriptionData?.subscription;
  const currentPlan = subscription?.plan || "free";
  const planLimits = getPlanLimits(currentPlan as any);

  const currentDomainCount = domains.length;
  const domainLimit = planLimits.maxDomains;
  const isAtLimit = domainLimit !== -1 && currentDomainCount >= domainLimit;
  const isUnlimited = domainLimit === -1;

  const handleAddDomainClick = () => {
    if (isAtLimit) {
      alert(
        `You've reached your domain limit (${domainLimit} domains). Upgrade your plan to add more domains.`,
      );
      return;
    }
    setIsCreating(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-white/5 rounded mb-2" />
            <div className="h-4 w-64 bg-white/5 rounded" />
          </div>
          <div className="h-10 w-40 bg-white/5 rounded-lg" />
        </div>

        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white/2 border border-white/5 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div>
                  <div className="h-4 w-48 bg-white/5 rounded mb-2" />
                  <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DomainHeader
        currentDomainCount={currentDomainCount}
        domainLimit={domainLimit}
        isUnlimited={isUnlimited}
        isAtLimit={isAtLimit}
        onAddClick={handleAddDomainClick}
      />

      <DomainLimitWarning
        isAtLimit={isAtLimit}
        domainLimit={domainLimit}
        currentPlan={currentPlan}
      />

      <CreateDomainModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={(domain) => createMutation.mutate(domain)}
        isPending={createMutation.isPending}
        error={error}
        setError={setError}
      />

      <div className="grid gap-4">
        {domains.map((domain: any) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            onVerify={(id) => verifyMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate(id)}
            isVerifying={verifyMutation.isPending}
          />
        ))}

        {domains.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No custom domains
            </h3>
            <p className="text-white/40 max-w-sm mx-auto mb-6">
              Add a custom domain to access your tunnels via your own branded
              URLs.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors border border-white/5"
            >
              Add your first domain
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
