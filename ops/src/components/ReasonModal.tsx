import { useEffect, useState } from "react";
import { Form, Input, Modal } from "antd";

interface ReasonModalProps {
  open: boolean;
  title: string;
  confirmText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/** Shared modal that collects a mandatory reason (suspend / request-changes). */
export default function ReasonModal({
  open,
  title,
  confirmText = "Confirm",
  danger,
  loading,
  onConfirm,
  onCancel,
}: ReasonModalProps) {
  const [form] = Form.useForm<{ reason: string }>();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  return (
    <Modal
      open={open}
      title={title}
      okText={confirmText}
      okButtonProps={{ danger, loading, disabled: !reason.trim() }}
      onOk={() => form.validateFields().then((v) => onConfirm(v.reason.trim()))}
      onCancel={onCancel}
      destroyOnHidden
      centered
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 18 }}>
        <Form.Item
          name="reason"
          label="Reason (shown to the vendor)"
          rules={[
            { required: true, message: "A reason is required" },
            { max: 1000, message: "Maximum 1000 characters" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Explain why…"
            style={{ padding: "12px 14px", resize: "vertical" }}
            onChange={(e) => setReason(e.target.value)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
