import React from "react";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  createBillingPortal,
  getBillingInvoices,
  getBillingOverview,
  getPendingCharges,
} from "../actions/billing_action";
import { createCheckoutSession } from "../actions/subscription_action";
import { useNotification } from "../modules/NotificationProvider";
import { notifyError } from "../utils/errorMessages";

// Amounts from the API are in cents
const formatAmount = (cents, currency) =>
  `${((cents ?? 0) / 100).toLocaleString()} ${(currency || "")
    .toUpperCase()}`;

export default function Billing() {
  const { t, i18n } = useTranslation();
  const notify = useNotification();

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
      if (res?.url) window.open(res.url, "_blank", "noopener,noreferrer");
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
  const hasSubscription = !!overview?.subscription;

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

      {overviewError && (
        <Alert
          type="error"
          message={t("billing.load_failed")}
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
                  onClick={() =>
                    hasSubscription
                      ? portalMutation.mutate()
                      : checkoutMutation.mutate()
                  }
                >
                  {t("billing.pending_charges.pay_now")}
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
