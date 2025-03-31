import React from 'react';
import { Breadcrumb, Layout } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const { Content } = Layout;

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  
  const path = location.pathname;
  const breadcrumbItems = [];
  
  // Always add Home
  breadcrumbItems.push({
    title: 'Home',
    onClick: () => navigate('/'),
  });
  
  // Add Levels
  if (path.includes('/levels')) {
    breadcrumbItems.push({
      title: 'Levels',
      onClick: () => navigate('/levels'),
    });
    
    // Add Level Detail
    if (path.includes('/show/') && params.id) {
      breadcrumbItems.push({
        title: 'Level Details',
      });
    }
  }
  
  return (
    <Layout.Header 
      style={{
        height: 'auto',
        lineHeight: 'normal',
        backgroundColor: 'transparent',
        padding: '12px 24px',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Content
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <Breadcrumb items={breadcrumbItems} />
      </Content>
    </Layout.Header>
  );
};
