import React, { createContext, useContext } from "react";
import { message } from "antd";

// Create context
const NotificationContext = createContext(null);

// Provider component
export const NotificationProvider = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage();

  // Function to trigger notifications
  const notify = (type, content) => {
    messageApi.open({ type, content });
  };

  return (
    <NotificationContext.Provider value={notify}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using notifications
export const useNotification = () => {
  return useContext(NotificationContext);
};
