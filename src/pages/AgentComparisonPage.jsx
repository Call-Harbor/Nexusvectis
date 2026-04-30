import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AgentComparison from "@/components/intellect/AgentComparison";

export default function AgentComparisonPage() {
  const [orgId, setOrgId] = useState(null);

  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.organization_id) {
          setOrgId(user.organization_id);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchOrgId();
  }, []);

  if (!orgId) return null;

  return <AgentComparison orgId={orgId} />;
}