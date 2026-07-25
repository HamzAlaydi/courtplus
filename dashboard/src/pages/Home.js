import React, { useState } from "react";
import { Alert, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getMe } from "../actions/staff.action";
import { getTenant } from "../actions/tenant_action";
import { getBranches } from "../actions/branch_action";
import { getTenantStats } from "../actions/stats_action";
import { getBillingOverview, getPendingCharges } from "../actions/billing_action";
import WelcomeHeader from "../components/home/WelcomeHeader";
import StatCards from "../components/home/StatCards";
import HomeCharts from "../components/home/HomeCharts";
import ProfileCompletionCard from "../components/home/ProfileCompletionCard";
import QuickActions from "../components/home/QuickActions";
import BranchesSummary from "../components/home/BranchesSummary";

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const navigate = useNavigate();
  const [subscribeBannerVisible, setSubscribeBannerVisible] = useState(true);

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

  // 🔹 Billing (shared cache keys with the Billing page). Billing endpoints
  // are owner-only — retry disabled so non-owner staff fail quietly.
  const { data: billingOverview } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: getBillingOverview,
    retry: false,
  });

  const { data: pendingCharges } = useQuery({
    queryKey: ["billing-pending-charges"],
    queryFn: getPendingCharges,
    retry: false,
  });

  const branches = branchesData?.items || [];
  const hasSubscription = !!billingOverview?.subscription;
  const showSubscribeBanner =
    subscribeBannerVisible &&
    ((billingOverview && !billingOverview.subscription) ||
      pendingCharges?.count > 0);

  return (
    <div className={`home ${isRTL ? "rtl" : ""}`}>
      <section className="home-section" style={{ animationDelay: "0ms" }}>
        <WelcomeHeader staff={staff} tenant={tenant} />
      </section>

      {showSubscribeBanner && (
        <section className="home-section" style={{ animationDelay: "40ms" }}>
          <Alert
            type="info"
            showIcon
            closable
            onClose={() => setSubscribeBannerVisible(false)}
            message={t("home.subscribe_banner")}
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate("/billing")}
              >
                {t("courts.pending_payment_action")}
              </Button>
            }
          />
        </section>
      )}

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
        <ProfileCompletionCard
          tenant={tenant}
          branches={branches}
          hasSubscription={hasSubscription}
        />
        <BranchesSummary branches={branches} />
        <QuickActions />
      </section>
    </div>
  );
}
