import { Card, Col, List, Row, Statistic, Typography } from "antd";
import { CheckSquareOutlined, HistoryOutlined, ShopOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { listLogs, listPendingCourts, listUnsuspendRequests } from "@/api/ops";
import StatusTag from "@/components/StatusTag";

const POLL = 30_000;

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: pendingCourts } = useQuery({
    queryKey: ["ops", "courts", "pending", "count"],
    queryFn: () => listPendingCourts({ page: 1, pageSize: 1 }),
    refetchInterval: POLL,
  });

  const { data: unsuspendRequests } = useQuery({
    queryKey: ["ops", "unsuspend-requests", "count"],
    queryFn: () => listUnsuspendRequests({ page: 1, pageSize: 1 }),
    refetchInterval: POLL,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["ops", "logs", "recent"],
    queryFn: () => listLogs({ page: 1, pageSize: 8 }),
    refetchInterval: POLL,
  });

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Dashboard
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate("/approvals")}
            loading={!pendingCourts}
          >
            <Statistic
              title="Courts pending review"
              value={pendingCourts?.pagination.totalCount ?? 0}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate("/vendors?tab=requests")}
            loading={!unsuspendRequests}
          >
            <Statistic
              title="Pending unsuspend requests"
              value={unsuspendRequests?.pagination.totalCount ?? 0}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable onClick={() => navigate("/logs")} loading={!recentLogs}>
            <Statistic
              title="Audit log entries"
              value={recentLogs?.pagination.totalCount ?? 0}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent activity" style={{ marginTop: 16 }} loading={!recentLogs}>
        <List
          size="small"
          dataSource={recentLogs?.items ?? []}
          locale={{ emptyText: "No activity yet" }}
          renderItem={(log) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Typography.Text style={{ fontSize: 13 }}>
                    <Typography.Text strong>{log.actorEmail ?? "system"}</Typography.Text>
                    {` ${log.action} `}
                    <StatusTag status={log.entity} />
                  </Typography.Text>
                }
                description={dayjs(log.createdAt).format("MMM D, YYYY HH:mm:ss")}
              />
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}
