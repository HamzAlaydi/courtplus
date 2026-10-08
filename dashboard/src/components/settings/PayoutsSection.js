import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getPayoutAccountStatus,
  getPayoutBalance,
  getPayoutSettings,
  updatePayoutSettings,
  listPayoutTransactions,
  listPayouts,
  requestPayout,
  startPayoutOnboarding,
} from "../../actions/payout_action";
import { notifyError } from "../../utils/errorMessages";
import { useNotification } from "../../modules/NotificationProvider";

const { Text } = Typography;

// Must match PayoutConstants.DEFAULT_MIN_PAYOUT_AMOUNT on the backend (major units).
export const MIN_PAYOUT_AMOUNT = 100;

const STATUS_COLORS = {
  pending: "gold",
  processing: "blue",
  completed: "green",
  failed: "red",
  cancelled: "default",
};

const CREDIT_TYPES = new Set(["booking_completed", "payout_failed", "adjustment"]);

const formatMoney = (value, currency) =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency || ""}`.trim();

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "—");

/**
 * Vendor payouts: balance, Stripe Connect onboarding and withdrawal requests.
 * Every backend endpoint used here existed already; the dashboard simply
 * never exposed them, so vendors had no way to receive their earnings.
 */
export default function PayoutsSection() {
  const { t } = useTranslation();
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [bankForm] = Form.useForm();
  const [amount, setAmount] = useState(null);

  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ["payouts", "balance"],
    queryFn: getPayoutBalance,
  });
  const { data: account, isLoading: loadingAccount } = useQuery({
    queryKey: ["payouts", "account"],
    queryFn: getPayoutAccountStatus,
  });
  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ["payouts", "list"],
    queryFn: () => listPayouts({ page: 1, pageSize: 10 }),
  });
  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ["payouts", "transactions"],
    queryFn: () => listPayoutTransactions({ page: 1, pageSize: 10 }),
  });

  const currency = balance?.currency || "";
  const available = Number(balance?.availableBalance || 0);
  const isReady = !!account?.isConfigured && !!account?.isActive;
  // The API refuses a new request while one is pending OR processing (a
  // manual bank transfer sits in "processing" until ops confirms it). Checking
  // only "pending" let the vendor submit a request that always failed.
  const hasPending = (payouts?.items || []).some((p) =>
    ["pending", "processing"].includes(p.status)
  );

  // Back from Stripe: ?payouts=complete (finished) or ?payouts=refresh (link expired).
  const returnState = searchParams.get("payouts");
  useEffect(() => {
    if (!returnState) return;
    if (returnState === "complete") {
      notify("success", t("settings.payouts.onboardingComplete"));
    } else if (returnState === "refresh") {
      notify("info", t("settings.payouts.onboardingExpired"));
    }
    queryClient.invalidateQueries({ queryKey: ["payouts", "account"] });
    const next = new URLSearchParams(searchParams);
    next.delete("payouts");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnState]);

  const onboardingMutation = useMutation({
    mutationFn: () => startPayoutOnboarding(),
    onSuccess: (res) => {
      const url = res?.url;
      if (url) {
        window.location.assign(url);
      } else {
        notify("error", t("errors.generic"));
      }
    },
    onError: (err) => notifyError(notify, err, t),
  });

  const requestMutation = useMutation({
    mutationFn: (value) => requestPayout(value),
    onSuccess: () => {
      notify("success", t("settings.payouts.requestSent"));
      form.resetFields();
      setAmount(null);
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
    onError: (err) => notifyError(notify, err, t),
  });

  const payoutColumns = useMemo(
    () => [
      {
        title: t("settings.payouts.date"),
        dataIndex: "createdAt",
        key: "createdAt",
        render: formatDate,
      },
      {
        title: t("settings.payouts.amount"),
        dataIndex: "amount",
        key: "amount",
        render: (value, row) => (
          <span className="payouts-amount">
            {formatMoney(value, row.currency || currency)}
          </span>
        ),
      },
      {
        title: t("settings.payouts.status"),
        dataIndex: "status",
        key: "status",
        render: (status, row) => (
          <>
            <Tag color={STATUS_COLORS[status] || "default"}>
              {t(`settings.payouts.statuses.${status}`, { defaultValue: status })}
            </Tag>
            {row.failureReason ? (
              <Text type="secondary" className="payouts-failure">
                {row.failureReason}
              </Text>
            ) : null}
          </>
        ),
      },
    ],
    [t, currency]
  );

  const txColumns = useMemo(
    () => [
      {
        title: t("settings.payouts.date"),
        dataIndex: "createdAt",
        key: "createdAt",
        render: formatDate,
      },
      {
        title: t("settings.payouts.type"),
        dataIndex: "type",
        key: "type",
        // A hold is written as a BOOKING_COMPLETED row, so without this every
        // held booking read as revenue that had already been credited.
        render: (type, row) =>
          row.metadata?.held
            ? t("settings.payouts.transactionTypes.booking_held")
            : t(`settings.payouts.transactionTypes.${type}`, {
                defaultValue: type,
              }),
      },
      {
        title: t("settings.payouts.amount"),
        dataIndex: "amount",
        key: "amount",
        render: (value, row) => {
          // Holds carry amount 0 and the real figure in metadata.heldAmount;
          // rendering the column value showed "+0.00" for every held booking,
          // so the later refund looked like money that never arrived.
          if (row.metadata?.held) {
            return (
              <Text type="secondary" className="payouts-amount">
                {formatMoney(
                  Math.abs(Number(row.metadata.heldAmount || 0)),
                  row.currency || currency
                )}
              </Text>
            );
          }
          const credit = CREDIT_TYPES.has(row.type);
          return (
            <Text
              type={credit ? "success" : "danger"}
              className="payouts-amount"
            >
              {credit ? "+" : "−"}
              {formatMoney(Math.abs(Number(value || 0)), row.currency || currency)}
            </Text>
          );
        },
      },
    ],
    [t, currency]
  );

  // Bank details are the fallback payout rail: Stripe Connect cannot onboard
  // vendors in every market, and without this the earnings had no way out.
  const { data: payoutSettings } = useQuery({
    queryKey: ["payouts", "settings"],
    queryFn: getPayoutSettings,
    // 404 simply means "not set up yet"; that is not an error worth surfacing.
    retry: false,
  });

  useEffect(() => {
    if (payoutSettings) {
      bankForm.setFieldsValue({
        bankName: payoutSettings.bankName || "",
        accountHolderName: payoutSettings.accountHolderName || "",
        iban: payoutSettings.iban || "",
      });
    }
  }, [payoutSettings, bankForm]);

  const bankMutation = useMutation({
    mutationFn: updatePayoutSettings,
    onSuccess: () => {
      notify("success", t("settings.payouts.bankSaved"));
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
    onError: (error) => notifyError(notify, error, t),
  });

  const renderBankDetails = () => (
    <Card size="small" title={t("settings.payouts.bankTitle")}>
      <Text type="secondary" className="payouts-lead">
        {t("settings.payouts.bankHint")}
      </Text>
      <Form
        className="settings-form"
        form={bankForm}
        layout="vertical"
        onFinish={(values) => bankMutation.mutate(values)}
      >
        <Form.Item
          name="accountHolderName"
          label={t("settings.payouts.accountHolder")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="bankName"
          label={t("settings.payouts.bankName")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="iban"
          label={t("settings.payouts.iban")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={bankMutation.isPending}>
          {t("settings.payouts.saveBank")}
        </Button>
      </Form>
    </Card>
  );

  const renderAccountBanner = () => {
    if (loadingAccount) return null;
    if (isReady) {
      return (
        <Alert
          type="success"
          showIcon
          message={t("settings.payouts.accountReady")}
        />
      );
    }
    const configured = !!account?.isConfigured;
    return (
      <Alert
        type={configured ? "warning" : "info"}
        showIcon
        message={
          configured
            ? t("settings.payouts.accountIncomplete")
            : t("settings.payouts.accountMissing")
        }
        description={t("settings.payouts.accountHint")}
        action={
          <Button
            type="primary"
            size="small"
            loading={onboardingMutation.isPending}
            onClick={() => onboardingMutation.mutate()}
          >
            {configured
              ? t("settings.payouts.continueSetup")
              : t("settings.payouts.setUp")}
          </Button>
        }
      />
    );
  };

  const canRequest =
    isReady && !hasPending && available >= MIN_PAYOUT_AMOUNT && !loadingBalance;

  return (
    <div className="payouts-section">
      <div className="payouts-kpis">
        <Card
          size="small"
          loading={loadingBalance}
          className="payouts-kpi payouts-kpi--ink"
        >
          <Statistic
            title={t("settings.payouts.available")}
            value={available}
            precision={2}
            suffix={currency}
          />
        </Card>
        <Card size="small" loading={loadingBalance} className="payouts-kpi">
          <Statistic
            title={t("settings.payouts.pending")}
            value={Number(balance?.pendingBalance || 0)}
            precision={2}
            suffix={currency}
          />
          <Text type="secondary" className="payouts-hint">
            {t("settings.payouts.pendingHint")}
          </Text>
        </Card>
        <Card size="small" loading={loadingBalance} className="payouts-kpi">
          <Statistic
            title={t("settings.payouts.totalEarnings")}
            value={Number(balance?.totalEarnings || 0)}
            precision={2}
            suffix={currency}
          />
        </Card>
      </div>

      {renderAccountBanner()}
      {renderBankDetails()}

      <Card size="small" title={t("settings.payouts.requestTitle")}>
        {hasPending ? (
          <Alert
            type="info"
            showIcon
            message={t("settings.payouts.pendingRequest")}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <Form
          className="payouts-request"
          form={form}
          layout="inline"
          onFinish={({ amount: value }) => requestMutation.mutate(Number(value))}
        >
          <Form.Item
            name="amount"
            rules={[
              { required: true, message: t("settings.payouts.amountRequired") },
              {
                type: "number",
                min: MIN_PAYOUT_AMOUNT,
                message: t("settings.payouts.minimum", {
                  amount: MIN_PAYOUT_AMOUNT,
                  currency,
                }),
              },
              {
                type: "number",
                max: available,
                message: t("errors.INSUFFICIENT_BALANCE"),
              },
            ]}
          >
            <InputNumber
              min={0}
              precision={2}
              step={50}
              style={{ width: 200 }}
              placeholder={t("settings.payouts.amountPlaceholder")}
              addonAfter={currency || null}
              disabled={!canRequest}
              onChange={setAmount}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!canRequest || !amount}
              loading={requestMutation.isPending}
            >
              {t("settings.payouts.request")}
            </Button>
          </Form.Item>
        </Form>
        <Text type="secondary" className="payouts-hint">
          {t("settings.payouts.requestHint", {
            amount: MIN_PAYOUT_AMOUNT,
            currency,
          })}
        </Text>
      </Card>

      <Card size="small" title={t("settings.payouts.history")}>
        <Table
          size="small"
          rowKey="id"
          loading={loadingPayouts}
          columns={payoutColumns}
          dataSource={payouts?.items || []}
          pagination={false}
          locale={{ emptyText: t("settings.payouts.noPayouts") }}
          scroll={{ x: true }}
        />
      </Card>

      <Card size="small" title={t("settings.payouts.transactions")}>
        <Table
          size="small"
          rowKey="id"
          loading={loadingTx}
          columns={txColumns}
          dataSource={transactions?.items || []}
          pagination={false}
          locale={{ emptyText: t("settings.payouts.noTransactions") }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
}
