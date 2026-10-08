import React from "react";
import { Modal, Button, Typography } from "antd";
import { MdDeleteOutline } from "react-icons/md";

const { Text, Title } = Typography;

const ModalDelete = ({ visible, onCancel, onConfirm, customText }) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      width={420}
      className="delete-modal"
    >
      <div className="modal-content">
        <span className="warning-icon" aria-hidden="true">
          <MdDeleteOutline />
        </span>
        <Title level={4} className="modal-title">
          {customText?.title || "Are you sure?"}
        </Title>
        <p className="modal-copy">
          <Text className="modal-description">{customText?.description}</Text>{" "}
          <Text className="modal-warning">{customText?.warning}</Text>{" "}
          <Text className="modal-description">{customText?.afterWarning}</Text>
        </p>
        <div className="modal-buttons">
          <Button type="primary" size="large" block onClick={onCancel}>
            {"No, Cancel"}
          </Button>
          <Button size="large" block danger onClick={onConfirm}>
            {customText?.confirmText || "Yes, Delete this branch"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDelete;
