import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getMe } from "../actions/staff.action";
import { getTenant } from "../actions/tenant_action";
import { getBranches } from "../actions/branch_action";
import { getTenantStats } from "../actions/stats_action";
import WelcomeHeader from "../components/home/WelcomeHeader";
import StatCards from "../components/home/StatCards";
import HomeCharts from "../components/home/HomeCharts";
import ProfileCompletionCard from "../components/home/ProfileCompletionCard";
import QuickActions from "../components/home/QuickActions";
import BranchesSummary from "../components/home/BranchesSummary";

export default function Home() {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const { data: staff } = useQuery({
    queryKey: ["staff-me"],
    queryFn: getMe,
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: getTenant,
  });

  const { data: stats } = useQuery({
    queryKey: ["tenant-stats"],
    queryFn: () => getTenantStats(),
  });

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
  });

  const branches = branchesData?.items || [];

  return (
    <div className={`home ${isRTL ? "rtl" : ""}`}>
      <section className="home-section" style={{ animationDelay: "0ms" }}>
        <WelcomeHeader staff={staff} tenant={tenant} />
      </section>

      <section className="home-section" style={{ animationDelay: "80ms" }}>
        <StatCards stats={stats} tenant={tenant} />
      </section>

      <section className="home-section" style={{ animationDelay: "160ms" }}>
        <HomeCharts stats={stats} />
      </section>

      <section
        className="home-section home-bottom"
        style={{ animationDelay: "240ms" }}
      >
        <ProfileCompletionCard tenant={tenant} />
        <BranchesSummary branches={branches} />
        <QuickActions />
      </section>
    </div>
  );
}
