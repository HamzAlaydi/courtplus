import React, { useEffect, useRef } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Table,
  Tag,
} from "antd";
import {
  CreditCardOutlined,
  FilePdfOutlined,
  PlusOutlined,
  ShopOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createBillingPortal,
  getBillingInvoices,
  getBillingOverview,
  getPendingCharges,
} from "../actions/billing_action";
import {
  createCheckoutSession,
  syncSubscription,
} from "../actions/subscription_action";
import { useNotification } from "../modules/NotificationProvider";
import { notifyError } from "../utils/errorMessages";

// Amounts from the API are in cents
const formatAmount = (cents, currency) =>
  `${((cents ?? 0) / 100).toLocaleString()} ${(currency || "")
    .toUpperCase()}`;

export default function Billing() {
  const { t, i18n } = useTranslation();
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const refetchBilling = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["billing-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["billing-invoices"] }),
      queryClient.invalidateQueries({ queryKey: ["billing-pending-charges"] }),
      queryClient.invalidateQueries({ queryKey: ["all-courts"] }),
    ]);

  // Confirm the subscription from Stripe on return from Checkout.
  //
  // The webhook that normally creates the local subscription row is
  // asynchronous: it can land after this page has already rendered, and in
  // local development it does not arrive at all unless `stripe listen` is
  // running. Either way the vendor was shown "Subscribe" again seconds after
  // paying. Handing the session id back lets the server pull the subscription
  // from Stripe directly, so what is shown here never depends on timing.
  const syncMutation = useMutation({
    mutationFn: ({ sessionId }) => syncSubscription({ sessionId }),
    onSuccess: async (res, { outcome }) => {
      await refetchBilling();
      if (outcome === "upgraded") {
        notify("success", t("billing.upgraded_toast"));
      } else if (res?.synced) {
        notify("success", t("billing.success_toast"));
      } else {
        notify("warning", t("billing.sync_failed"));
      }
    },
    onError: () => {
      notify("warning", t("billing.sync_failed"));
    },
  });

  const handledReturn = useRef(false);
  useEffect(() => {
    if (handledReturn.current) return;
    const outcome = searchParams.get("subscription");
    if (!outcome) return;
    handledReturn.current = true;

    const sessionId = searchParams.get("session_id") || undefined;

    if (outcome === "success" || outcome === "upgraded") {
      syncMutation.mutate({ sessionId, outcome });
    } else if (outcome === "cancelled") {
      notify("info", t("billing.cancelled_toast"));
    }

    // Strip the params so a reload does not re-run the confirmation or
    // re-show the toast.
    const next = new URLSearchParams(searchParams);
    next.delete("subscription");
    next.delete("session_id");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: overview, isError: overviewError } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: getBillingOverview,
  });

  const { data: invoices } = useQuery({
    queryKey: ["billing-invoices"],
    queryFn: getBillingInvoices,
  });

  const { data: pendingCharges } = useQuery({
    queryKey: ["billing-pending-charges"],
    queryFn: getPendingCharges,
  });

  const portalMutation = useMutation({
    mutationFn: () => createBillingPortal(window.location.href),
    onSuccess: (res) => {
      // Navigate in place: window.open after an async call is a popup for
      // most browsers and was blocked, so "Manage payment method" often did
      // nothing. The portal returns to /billing on its own.
      if (res?.url) window.location.href = res.url;
    },
    onError: (err) => {
      notifyError(notify, err, t, "billing.portal_failed");
    },
  });

  // 🔹 Start the base-plan checkout (no active subscription yet)
  const checkoutMutation = useMutation({
    mutationFn: () =>
      createCheckoutSession({
        branchCount: 1,
        successUrl: `${window.location.origin}/billing?subscription=success`,
        cancelUrl: `${window.location.origin}/billing?subscription=cancelled`,
      }),
    onSuccess: (res) => {
      if (res?.url) window.location.href = res.url;
    },
    onError: (err) => {
      notifyError(notify, err, t, "billing.checkout_failed");
    },
  });

  const breakdown = overview?.breakdown;
  const pricing = overview?.pricing;
  const currency = pricing?.currency || breakdown?.currency;
  // Only a live subscription counts. Treating ANY row as "subscribed" hid the
  // Subscribe button from cancelled and unpaid tenants, so they had no way to
  // come back — and their courts stayed in pending_payment indefinitely.
  const LIVE_STATUSES = ["active", "past_due", "trialing"];
  const hasSubscription = LIVE_STATUSES.includes(overview?.subscription?.status);
  const openInvoice = (invoices || []).find((inv) => inv.status === "open");

  const invoiceColumns = [
    {
      title: t("billing.invoices.number"),
      dataIndex: "number",
      key: "number",
      render: (value, record) => value || record.id,
    },
    {
      title: t("billing.invoices.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) =>
        value ? new Date(value).toLocaleDateString(i18n.language) : "—",
    },
    {
      title: t("billing.invoices.amount"),
      dataIndex: "amountPaidCents",
      key: "amount",
      render: (value, record) =>
        formatAmount(record.amountPaidCents ?? record.amountDueCents, record.currency),
    },
    {
      title: t("billing.invoices.status"),
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={value === "paid" ? "green" : "orange"}>{value}</Tag>
      ),
    },
    {
      title: t("billing.invoices.pdf"),
      key: "pdf",
      render: (_, record) =>
        record.pdfUrl || record.hostedInvoiceUrl ? (
          <a
            href={record.pdfUrl || record.hostedInvoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FilePdfOutlined /> {t("billing.invoices.view")}
          </a>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="content billing-page">
      <div className="content-header">
        <h4>{t("billing.title")}</h4>
        {hasSubscription && (
          <Button
            type="primary"
            icon={<CreditCardOutlined />}
            loading={portalMutation.isPending}
            onClick={() => portalMutation.mutate()}
          >
            {t("billing.manage_payment")}
          </Button>
        )}
      </div>

      {syncMutation.isPending && (
        <Alert
          type="info"
          showIcon
          message={t("billing.confirming")}
          style={{ marginBottom: 24 }}
        />
      )}

      {overviewError && (
        <Alert
          type="error"
          message={t("billing.load_failed")}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Cancellation scheduled from the Stripe portal: say when the plan
          ends and that it can still be resumed. Nothing surfaced this before. */}
      {overview?.subscription?.cancelAtPeriodEnd && (
        <Alert
          type="warning"
          showIcon
          message={t("billing.ends_on", {
            date: new Date(
              overview.subscription.cancelAt ||
                overview.subscription.currentPeriodEnd
            ).toLocaleDateString(),
          })}
          description={t("billing.ends_on_hint")}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 🔹 Subscribe CTA when there is no active subscription */}
      {overview && !hasSubscription && (
        <Alert
          type="info"
          showIcon
          message={t("billing.subscribe_cta.title")}
          description={t("billing.subscribe_cta.description", {
            amount: formatAmount(pricing?.baseAmountCents, currency),
          })}
          action={
            <Button
              type="primary"
              loading={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              {t("billing.subscribe_cta.button")}
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 🔹 Plan overview */}
      <div className="billing-cards">
        <Card className="billing-card">
          <ShopOutlined className="billing-card-icon" />
          <span>{t("billing.base_plan")}</span>
          <h3>{formatAmount(pricing?.baseAmountCents, currency)}</h3>
          <small>{t("billing.per_month")}</small>
        </Card>

        <Card className="billing-card">
          <PlusOutlined className="billing-card-icon" />
          <span>{t("billing.branch_addons")}</span>
          <h3>{breakdown?.branchAddons ?? 0}</h3>
          <small>
            {t("billing.branches_count", { count: breakdown?.branchCount ?? 0 })}
          </small>
        </Card>

        <Card className="billing-card">
          <TrophyOutlined className="billing-card-icon" />
          <span>{t("billing.court_addons")}</span>
          <h3>{breakdown?.courtAddons ?? 0}</h3>
          <small>
            {t("billing.courts_count", { count: breakdown?.courtCount ?? 0 })}
          </small>
        </Card>

        <Card className="billing-card billing-card-total">
          <CreditCardOutlined className="billing-card-icon" />
          <span>{t("billing.next_invoice")}</span>
          <h3>
            {formatAmount(
              overview?.nextInvoiceAmountCents ??
                breakdown?.monthlyAmountCents,
              currency
            )}
          </h3>
          <small>
            {overview?.subscription?.status
              ? t(`billing.subscription_status.${overview.subscription.status}`, overview.subscription.status)
              : t("billing.no_subscription")}
          </small>
        </Card>
      </div>

      {/* 🔹 Pending charges */}
      {pendingCharges?.count > 0 && (
        <Card
          title={t("billing.pending_charges.title")}
          className="billing-section"
        >
          <ul className="billing-pending-list">
            {pendingCharges.courts.map((court) => (
              <li key={court.id}>
                <span>{court.name}</span>
                <Tag color="orange">
                  {t("courtCard.status.pending_payment")}
                </Tag>
                <Button
                  size="small"
                  type="primary"
                  loading={
                    portalMutation.isPending || checkoutMutation.isPending
                  }
                  onClick={() => {
                    if (!hasSubscription) return checkoutMutation.mutate();
                    // A pending court means Stripe issued a prorated invoice.
                    // Send the vendor to THAT invoice, not the generic portal
                    // where they would have to go looking for it.
                    if (openInvoice?.hostedInvoiceUrl) {
                      window.open(openInvoice.hostedInvoiceUrl, "_blank", "noopener,noreferrer");
                      return;
                    }
                    portalMutation.mutate();
                  }}
                >
                  {hasSubscription && openInvoice
                    ? t("billing.pay_invoice")
                    : t("billing.pending_charges.pay_now")}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 🔹 Invoices */}
      <Card title={t("billing.invoices.title")} className="billing-section">
        <Table
          rowKey="id"
          columns={invoiceColumns}
          dataSource={invoices || []}
          pagination={false}
          locale={{ emptyText: <Empty description={t("billing.invoices.empty")} /> }}
        />
      </Card>
    </div>
  );
}
