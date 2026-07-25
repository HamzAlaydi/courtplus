import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { App as AntApp, ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthContext";
import { RequireAuth, RequireGuest } from "@/auth/guards";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CourtApprovalsPage from "@/pages/CourtApprovalsPage";
import VendorsPage from "@/pages/VendorsPage";
import ActivityLogPage from "@/pages/ActivityLogPage";
import AdminsPage from "@/pages/AdminsPage";
import { theme } from "@/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<RequireGuest />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>
                <Route element={<RequireAuth />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="/approvals" element={<CourtApprovalsPage />} />
                    <Route path="/vendors" element={<VendorsPage />} />
                    <Route path="/logs" element={<ActivityLogPage />} />
                    <Route path="/admins" element={<AdminsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
