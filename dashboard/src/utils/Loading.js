import { Flex, Spin } from "antd";

export default function Loading() {
  return (
    <Flex
      style={{ width: "100vw", height: "100vh" }}
      align="center"
      justify="center"
      gap="middle"
    >
      <Spin size="large" />
    </Flex>
  );
}
