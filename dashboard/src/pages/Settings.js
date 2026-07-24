import { Card, Form, Input, Button, Modal, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  changePassword,
  changeEmail,
  verifyEmail,
  cancelEmailChange,
  deleteAcc,
  deleteAccVerify,
} from "../actions/staff.action";
import { useNotification } from "../modules/NotificationProvider";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const notify = useNotification();

  /* ================= FORMS ================= */
  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const [deleteForm] = Form.useForm();

  /* ================= LOADING ================= */
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  /* ================= EMAIL STATE ================= */
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  /* ================= DELETE ACCOUNT STATE ================= */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1=password, 2=otp
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [deletePassword, setDeletePassword] = useState(""); // 🔐 stored once

  /* ================= OTP COUNTDOWN ================= */
  useEffect(() => {
    if (deleteStep !== 2 || canResend) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deleteStep, canResend]);

  /* ================= CHANGE PASSWORD ================= */
  const handleChangePassword = async (values) => {
    setLoadingPass(true);
    try {
      await changePassword({
        currentPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      notify("success", t("settings.passwordUpdated"));
      passwordForm.resetFields();
    } catch {
      notify("error", t("settings.passwordUpdateFailed"));
    } finally {
      setLoadingPass(false);
    }
  };

  /* ================= CHANGE EMAIL ================= */
  const handleChangeEmail = async (values) => {
    setLoadingEmail(true);
    try {
      await changeEmail(values);
      notify("success", t("settings.codeSent"));
      setPendingVerification(true);
      setPendingEmail(values.email);
      emailForm.resetFields();
    } catch {
      notify("error", t("settings.sendCodeFailed"));
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleVerifyEmail = async (values) => {
    setLoadingVerify(true);
    try {
      await verifyEmail(values);
      notify("success", t("settings.emailVerified"));
      setPendingVerification(false);
      setPendingEmail("");
      verifyForm.resetFields();
    } catch {
      notify("error", t("settings.emailVerificationFailed"));
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleCancelEmailChange = async () => {
    setLoadingCancel(true);
    try {
      await cancelEmailChange();
      notify("success", t("settings.emailCancelSuccess"));
      setPendingVerification(false);
      setPendingEmail("");
    } catch {
      notify("error", t("settings.emailCancelFailed"));
    } finally {
      setLoadingCancel(false);
    }
  };

  /* ================= DELETE ACCOUNT ================= */
  const handleDeleteRequest = async (values) => {
    setLoadingDelete(true);
    try {
      await deleteAcc({ password: values.password });

      // 🔐 store password for resend
      setDeletePassword(values.password);

      notify("success", t("settings.deleteOtpSent"));
      setDeleteStep(2);
      setTimer(120);
      setCanResend(false);
      deleteForm.resetFields();
    } catch (err) {
      console.log(err);
      notify(
        "error",
        err?.response?.data?.code || t("settings.deleteRequestFailed")
      );
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleDeleteConfirm = async (values) => {
    setLoadingDelete(true);
    try {
      await deleteAccVerify({ code: values.code });
      notify("success", t("settings.accountDeleted"));
      window.location.href = "/login";
    } catch {
      notify("error", t("settings.invalidCode"));
    } finally {
      setLoadingDelete(false);
    }
  };

  /* ================= RESEND OTP WITH PASSWORD ================= */
  const handleResendOtp = async () => {
    if (!deletePassword) {
      notify("error", t("settings.passwordRequired"));
      return;
    }

    try {
      await deleteAcc({ password: deletePassword });
      notify("success", t("settings.otpResent"));
      setTimer(120);
      setCanResend(false);
    } catch {
      notify("error", t("settings.otpResendFailed"));
    }
  };

  /* ================= UI ================= */
  return (
    <div
      className="settings-page"
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 24,
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <h2>{t("settings.title")}</h2>

      {/* CHANGE PASSWORD */}
      <Card title={t("settings.passwordSection")} style={{ marginBottom: 24 }}>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label={t("settings.oldPassword")}
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t("settings.newPassword")}
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t("settings.confirmNewPassword")}
            dependencies={["newPassword"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || value === getFieldValue("newPassword")
                    ? Promise.resolve()
                    : Promise.reject();
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loadingPass}>
            {t("settings.updatePassword")}
          </Button>
        </Form>
      </Card>

      {/* EMAIL */}
      {!pendingVerification ? (
        <Card title={t("settings.emailSection")}>
          <Form form={emailForm} layout="vertical" onFinish={handleChangeEmail}>
            <Form.Item
              name="email"
              label={t("settings.newEmail")}
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label={t("settings.currentPassword")}
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loadingEmail}>
              {t("settings.sendVerification")}
            </Button>
          </Form>
        </Card>
      ) : (
        <Card title={`${t("settings.verifyEmailTitle")} (${pendingEmail})`}>
          <Form
            form={verifyForm}
            layout="vertical"
            onFinish={handleVerifyEmail}
          >
            <Form.Item
              name="code"
              label={t("settings.verificationCode")}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loadingVerify}>
              {t("settings.verifyEmail")}
            </Button>
            <Button
              danger
              onClick={handleCancelEmailChange}
              loading={loadingCancel}
            >
              {t("settings.cancelEmailChange")}
            </Button>
          </Form>
        </Card>
      )}

      {/* DELETE ACCOUNT */}

      <Button
        style={{ marginTop: 24 }}
        type="primary"
        danger
        block
        onClick={() => setDeleteModalOpen(true)}
      >
        {t("settings.deleteAccount")}
      </Button>

      <Modal
        open={deleteModalOpen}
        footer={null}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteStep(1);
          setDeletePassword(""); // 🔐 clear safely
          deleteForm.resetFields();
        }}
        title={t("settings.confirmDelete")}
      >
        {deleteStep === 1 ? (
          <Form
            form={deleteForm}
            layout="vertical"
            onFinish={handleDeleteRequest}
          >
            <Text type="danger">{t("settings.deleteWarning")}</Text>
            <Form.Item
              name="password"
              label={t("settings.currentPassword")}
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
            <Button danger block htmlType="submit" loading={loadingDelete}>
              {t("settings.sendDeleteCode")}
            </Button>
          </Form>
        ) : (
          <Form
            form={deleteForm}
            layout="vertical"
            onFinish={handleDeleteConfirm}
          >
            <Form.Item
              name="code"
              label={t("settings.otpCode")}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Button danger block htmlType="submit" loading={loadingDelete}>
              {t("settings.confirmDelete")}
            </Button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              {canResend ? (
                <Button type="link" onClick={handleResendOtp}>
                  {t("settings.resendCode")}
                </Button>
              ) : (
                <Text type="secondary">
                  {t("settings.resendIn")} {timer}s
                </Text>
              )}
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
