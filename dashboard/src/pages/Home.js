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
import RecentReservations from "../components/home/RecentReservations";
import ProfileCompletionCard from "../components/home/ProfileCompletionCard";
import QuickActions from "../components/home/QuickActions";
import BranchesSummary from "../components/home/BranchesSummary";
import CourtsSummary from "../components/home/CourtsSummary";

export default function Home() {
  const { t } = useTranslation();
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
  const hasSubscription = ["active", "past_due", "trialing"].includes(
    billingOverview?.subscription?.status
  );
  const showSubscribeBanner =
    subscribeBannerVisible &&
    ((billingOverview && !billingOverview.subscription) ||
      pendingCharges?.count > 0);

  return (
    <div className="home cp-stack cp-stagger">
      <WelcomeHeader staff={staff} tenant={tenant} />

      {showSubscribeBanner && (
        <Alert
          type="info"
          showIcon
          closable
          className="home-banner"
          onClose={() => setSubscribeBannerVisible(false)}
          message={t("home.subscribe_banner", {
            amount: `${(
              (billingOverview?.pricing?.baseAmountCents ?? 3000) / 100
            ).toLocaleString()} ${(
              billingOverview?.pricing?.currency || "usd"
            ).toUpperCase()}`,
          })}
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
      )}

      <StatCards stats={stats} tenant={tenant} />

      <div className="home-split">
        <RecentReservations />
        <CourtsSummary />
      </div>

      <HomeCharts stats={stats} />

      <div className="home-bottom">
        <ProfileCompletionCard
          tenant={tenant}
          branches={branches}
          hasSubscription={hasSubscription}
        />
        <BranchesSummary branches={branches} />
        <QuickActions />
      </div>
    </div>
  );
}
