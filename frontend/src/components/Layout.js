import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, message, Spin, Typography } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  MessageOutlined, 
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentAdmin } from '../services/api';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 检查是否有 token
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchCurrentAdmin();
  }, [navigate]);

  const fetchCurrentAdmin = async () => {
    setLoading(true);
    try {
      const response = await getCurrentAdmin();
      setAdmin(response.data);
    } catch (error) {
      console.error('获取管理员信息失败:', error);
      if (error.response?.status === 401) {
        // 如果认证失败，退出登录
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    message.success('已退出登录');
    navigate('/login');
  };

  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/dashboard') return '1';
    if (path.startsWith('/users')) return '2';
    if (path.startsWith('/pushes')) return '3';
    if (path.startsWith('/logs')) return '4';
    return '1';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        padding: '0 24px', 
        background: '#fff', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        height: '64px',
        position: 'fixed',
        zIndex: 1000,
        width: '100%'
      }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1890ff',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Button 
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              marginRight: '16px', 
              fontSize: '16px',
              border: 'none',
              padding: '4px 8px'
            }}
          />
          Telegram 推送系统
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {admin && (
            <span style={{ marginRight: '16px' }}>
              欢迎，{admin.username}
            </span>
          )}
          <Button type="primary" ghost icon={<LogoutOutlined />} onClick={handleLogout}>
            退出
          </Button>
        </div>
      </Header>
      <Layout style={{ marginTop: '64px' }}>
        <Sider 
          width={220}
          theme="light"
          collapsed={collapsed}
          style={{ 
            background: '#fff',
            boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            zIndex: 100
          }}
        >
          <div style={{ height: '20px' }} /> {/* 顶部留白 */}
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ 
              borderRight: 0, 
              padding: '0 8px'  /* 菜单内边距，增加留白 */
            }}
            items={[
              {
                key: '1',
                icon: <DashboardOutlined />,
                label: <Link to="/dashboard">仪表盘</Link>
              },
              {
                key: '2',
                icon: <UserOutlined />,
                label: <Link to="/users">用户管理</Link>
              },
              {
                key: '3',
                icon: <MessageOutlined />,
                label: <Link to="/pushes">推送管理</Link>
              },
              {
                key: '4',
                icon: <FileTextOutlined />,
                label: <Link to="/logs">日志管理</Link>
              }
            ]}
          />
        </Sider>
        <Layout style={{ 
          padding: '24px',
          background: '#f5f7fa',
          marginLeft: collapsed ? '80px' : '220px',
          transition: 'all 0.2s'
        }}>
          <Content
            style={{
              background: '#fff',
              padding: '32px',
              margin: 0,
              borderRadius: '8px',
              minHeight: 280,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;