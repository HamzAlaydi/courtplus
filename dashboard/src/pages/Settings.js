import { Collapse, Form, Input, Button, Modal, Typography } from "antd";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import {
  changePassword,
  changeEmail,
  verifyEmail,
  cancelEmailChange,
  deleteAcc,
  deleteAccVerify,
} from "../actions/staff.action";
import { getTenant, updateTenant } from "../actions/tenant_action";
import { uploadImageToS3 } from "../utils/functions";
import ImageUploader from "../components/ImageUploader";
import { useNotification } from "../modules/NotificationProvider";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const notify = useNotification();
  const queryClient = useQueryClient();

  /* ================= BUSINESS PROFILE ================= */
  const [businessForm] = Form.useForm();
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [logoAssetId, setLogoAssetId] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: getTenant,
  });

  useEffect(() => {
    if (tenant) {
      businessForm.setFieldsValue({
        name: tenant.name || "",
        phoneNumber: tenant.phoneNumber || "",
      });
      setLogoUrl(tenant.logoURL || null);
    }
  }, [tenant, businessForm]);

  const handleUploadLogo = async (file, callbackOptions = {}) => {
    const { onSuccess, onError } = callbackOptions || {};
    if (!file) return;

    try {
      const { assetId, assetUrl } = await uploadImageToS3(file, "tenant_logo");
      setLogoAssetId(assetId);
      setLogoUrl(assetUrl);
      onSuccess?.(assetUrl);
      notify("success", t("branchForm.notifications.logo_uploaded"));
    } catch (err) {
      console.error("Upload failed:", err);
      onError?.(err);
      notify("error", t("branchForm.notifications.upload_failed"));
    }
  };

  const handleSaveBusiness = async (values) => {
    setLoadingBusiness(true);
    try {
      await updateTenant({
        name: values.name,
        phoneNumber: values.phoneNumber,
        ...(logoAssetId ? { logoAssetId } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      notify("success", t("business_profile.saved"));
    } catch (err) {
      console.log(err);
      notify(
        "error",
        err?.response?.data?.code || t("business_profile.save_failed")
      );
    } finally {
      setLoadingBusiness(false);
    }
  };

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
  const [emailChangeCreds, setEmailChangeCreds] = useState(null); // 🔐 stored once for resend
  const [emailTimer, setEmailTimer] = useState(60);
  const [canResendEmail, setCanResendEmail] = useState(false);

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

  /* ================= EMAIL OTP COUNTDOWN ================= */
  useEffect(() => {
    if (!pendingVerification || canResendEmail) return;

    const interval = setInterval(() => {
      setEmailTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResendEmail(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingVerification, canResendEmail]);

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
      setEmailChangeCreds(values); // 🔐 store for resend
      setEmailTimer(60);
      setCanResendEmail(false);
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
      setEmailChangeCreds(null); // 🔐 clear safely
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
      setEmailChangeCreds(null); // 🔐 clear safely
    } catch {
      notify("error", t("settings.emailCancelFailed"));
    } finally {
      setLoadingCancel(false);
    }
  };

  /* ================= RESEND EMAIL OTP ================= */
  const handleResendEmailOtp = async () => {
    if (!emailChangeCreds) {
      notify("error", t("settings.otpResendFailed"));
      return;
    }

    try {
      await changeEmail(emailChangeCreds);
      notify("success", t("settings.otpResent"));
      setEmailTimer(60);
      setCanResendEmail(false);
    } catch {
      notify("error", t("settings.otpResendFailed"));
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

      {/* SETTINGS SECTIONS (accordion) */}
      <Collapse
        accordion
        defaultActiveKey={["business"]}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: "business",
            label: t("business_profile.title"),
            children: (
              <Form
                form={businessForm}
                layout="vertical"
                onFinish={handleSaveBusiness}
              >
                <Form.Item
                  name="name"
                  label={t("business_profile.name")}
                  rules={[{ required: true, min: 3 }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="phoneNumber"
                  label={t("business_profile.phone")}
                  rules={[
                    {
                      validator: (_, value) =>
                        !value || isValidPhoneNumber(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(t("business_profile.phone_invalid"))
                            ),
                    },
                  ]}
                >
                  <PhoneInput defaultCountry="EG" />
                </Form.Item>
                <Form.Item label={t("business_profile.logo")}>
                  <ImageUploader
                    initialUrl={logoUrl}
                    onFileChange={handleUploadLogo}
                    shape="circle"
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loadingBusiness}
                >
                  {t("business_profile.save")}
                </Button>
              </Form>
            ),
          },
          {
            key: "password",
            label: t("settings.passwordSection"),
            children: (
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
            ),
          },
          {
            key: "email",
            label: pendingVerification
              ? `${t("settings.verifyEmailTitle")} (${pendingEmail})`
              : t("settings.emailSection"),
            children: !pendingVerification ? (
              <Form
                form={emailForm}
                layout="vertical"
                onFinish={handleChangeEmail}
              >
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
            ) : (
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
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loadingVerify}
                >
                  {t("settings.verifyEmail")}
                </Button>
                <Button
                  danger
                  onClick={handleCancelEmailChange}
                  loading={loadingCancel}
                >
                  {t("settings.cancelEmailChange")}
                </Button>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  {canResendEmail ? (
                    <Button type="link" onClick={handleResendEmailOtp}>
                      {t("settings.resendCode")}
                    </Button>
                  ) : (
                    <Text type="secondary">
                      {t("settings.resendIn")} {emailTimer}s
                    </Text>
                  )}
                </div>
              </Form>
            ),
          },
          {
            key: "delete",
            label: t("settings.deleteAccount"),
            children: (
              <Button
                type="primary"
                danger
                block
                onClick={() => setDeleteModalOpen(true)}
              >
                {t("settings.deleteAccount")}
              </Button>
            ),
          },
        ]}
      />

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
