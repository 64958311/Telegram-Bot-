import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Spin, message, Empty } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { getStats, getPushes } from '../services/api';
import moment from 'moment';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    user_count: 0,
    active_user_count: 0,
    push_count: 0,
    completed_push_count: 0,
    sent_log_count: 0,
    failed_log_count: 0,
    success_rate: 0
  });
  const [recentPushes, setRecentPushes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取统计数据
      const statsResponse = await getStats();
      setStats(statsResponse.data);

      try {
        // 获取最近推送（即使统计API成功，推送API可能失败）
        const pushesResponse = await getPushes({ limit: 5 });
        setRecentPushes(pushesResponse.data);
      } catch (pushError) {
        console.error('获取推送数据失败:', pushError);
        // 不设置全局错误，仍然显示统计数据
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setError(error);
      message.error('获取统计数据失败: ' + (error.response?.data?.detail || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'push_id',
      key: 'push_id',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color, text;
        
        switch (status) {
          case 'draft':
            color = '#d9d9d9';
            text = '草稿';
            break;
          case 'scheduled':
            color = '#1890ff';
            text = '计划中';
            break;
          case 'sending':
            color = '#1890ff';
            text = '发送中';
            break;
          case 'completed':
            color = '#52c41a';
            text = '已完成';
            break;
          case 'cancelled':
            color = '#f5222d';
            text = '已取消';
            break;
          default:
            color = '#d9d9d9';
            text = status;
            break;
        }
        
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: '发送计数',
      dataIndex: 'sent_count',
      key: 'sent_count',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '280px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Empty description="获取数据失败" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={fetchData}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表盘</h1>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="用户总数"
              value={stats.user_count}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="活跃用户"
              value={stats.active_user_count}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="推送总数"
              value={stats.push_count}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="推送成功率"
              value={stats.success_rate}
              suffix="%"
              precision={2}
              valueStyle={{ color: stats.success_rate > 90 ? '#3f8600' : '#cf1322' }}
              prefix={stats.success_rate > 90 ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={24}>
          <Card 
            title="最近推送" 
            extra={<Link to="/pushes"><Button type="link">查看所有</Button></Link>}
            bordered={false}
          >
            {recentPushes.length > 0 ? (
              <Table
                dataSource={recentPushes}
                columns={columns}
                rowKey="push_id"
                pagination={false}
                size="middle"
              />
            ) : (
              <Empty description="暂无推送数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;