import React from "react";
import { Modal, Button, Typography } from "antd";

const { Text, Title } = Typography;

const ModalDelete = ({ visible, onCancel, onConfirm, customText }) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      width={400}
      className="delete-modal"
    >
      <div className="modal-content">
        <img
          src="/assets/images/icons/warning.png"
          alt="Warning"
          className="warning-icon"
        />
        <Title level={4} className="modal-title">
          {customText?.title || "Are you sure?"}
        </Title>
        <Text className="modal-description">{customText?.description}</Text>
        <Text className="modal-warning">{customText?.warning}</Text>
        <Text className="modal-description"> {customText?.afterWarning}</Text>
        <div className="modal-buttons">
          <Button type="primary" onClick={onCancel}>
            {"No, Cancel"}
          </Button>
          <Button variant="outlined" danger onClick={onConfirm}>
            {customText?.confirmText || "Yes, Delete this branch"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDelete;
