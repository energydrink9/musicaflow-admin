import React from "react";
import { Layout as AntdLayout } from "antd";

const { Content } = AntdLayout;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AntdLayout style={{ minHeight: "100vh", width: "100%" }}>
      <Content
        style={{
          padding: "24px",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {children}
      </Content>
    </AntdLayout>
  );
};
