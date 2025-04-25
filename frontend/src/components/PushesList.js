import React, { useEffect, useState } from 'react';
import { Table, Button, Card, message, Tag, Popconfirm, Space } from 'antd';
import { PlusOutlined, SendOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPushes, sendPush, cancelPush, deletePush,deletePushMessage } from '../services/api';
import moment from 'moment';
import { Link } from 'react-router-dom';

const PushesList = () => {
  const [pushes, setPushes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchPushes();
  }, [pagination.current, pagination.pageSize]);

  const fetchPushes = async () => {
    setLoading(true);
    try {
      const response = await getPushes({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize
      });
      setPushes(response.data);
      setPagination({
        ...pagination,
        total: response.headers['x-total-count'] || response.data.length
      });
    } catch (error) {
      console.error('获取推送列表失败:', error);
      message.error('获取推送列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (pushId) => {
    try {
      await sendPush(pushId);
      message.success('推送已发送');
      fetchPushes();
    } catch (error) {
      console.error('发送推送失败:', error);
      message.error('发送推送失败: ' + (error.response?.data?.detail || '未知错误'));
    }
  };

  const handleCancel = async (pushId) => {
    try {
      await cancelPush(pushId);
      message.success('推送已取消');
      fetchPushes();
    } catch (error) {
      console.error('取消推送失败:', error);
      message.error('取消推送失败: ' + (error.response?.data?.detail || '未知错误'));
    }
  };

  const handleDelete = async (pushId) => {
    try {
      await deletePush(pushId);
      message.success('推送已删除');
      fetchPushes();
    } catch (error) {
      console.error('删除推送失败:', error);
      message.error('删除推送失败: ' + (error.response?.data?.detail || '未知错误'));
    }
  };

  const handleDeleteMessage = async (pushId) => {
    try {
      await deletePushMessage(pushId);
      message.success('消息已删除');
      fetchPushes();  // 刷新列表
    } catch (error) {
      console.error('删除消息失败:', error);
      message.error('删除消息失败: ' + (error.response?.data?.detail || '未知错误'));
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
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      render: (type) => {
        let text = type;
        switch (type) {
          case 'text':
            text = '文本';
            break;
          case 'photo':
            text = '图片';
            break;
          case 'video':
            text = '视频';
            break;
          case 'document':
            text = '文档';
            break;
          case 'audio':
            text = '音频';
            break;
          default:
            break;
        }
        return text;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        let text = '';

        switch (status) {
          case 'draft':
            color = 'default';
            text = '草稿';
            break;
          case 'scheduled':
            color = 'processing';
            text = '计划中';
            break;
          case 'sending':
            color = 'processing';
            text = '发送中';
            break;
          case 'completed':
            color = 'success';
            text = '已完成';
            break;
          case 'cancelled':
            color = 'error';
            text = '已取消';
            break;
          default:
            color = 'default';
            text = status;
            break;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '目标用户数',
      key: 'target_users',
      render: (_, record) => {
        const targetUserIds = Array.isArray(record.target_user_ids)
          ? record.target_user_ids
          : JSON.parse(record.target_user_ids || '[]');
        return targetUserIds.length;
      },
    },
    {
      title: '已发送',
      dataIndex: 'sent_count',
      key: 'sent_count',
    },
    {
      title: '计划时间',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {(record.status === 'draft' || record.status === 'scheduled') && (
            <Popconfirm
              title="确定要发送这条推送吗？"
              onConfirm={() => handleSend(record.push_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="primary" icon={<SendOutlined />} size="small">
                发送
              </Button>
            </Popconfirm>
          )}

          {(record.status === 'scheduled') && (
            <Popconfirm
              title="确定要取消这条推送吗？"
              onConfirm={() => handleCancel(record.push_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="default" icon={<StopOutlined />} size="small">
                取消
              </Button>
            </Popconfirm>
          )}

          {(record.status === 'draft' || record.status === 'scheduled' || record.status === 'cancelled') && (
            <Popconfirm
              title="确定要删除这条推送吗？"
              onConfirm={() => handleDelete(record.push_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                删除
              </Button>
            </Popconfirm>
          )}
          {record.status === 'completed' && (
            <Popconfirm
              title="确定要删除这条已发送的消息吗？此操作不可撤销。"
              onConfirm={() => handleDeleteMessage(record.push_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button danger size="small">
                删除消息
              </Button>
            </Popconfirm>
          )}

          <Link to={`/logs/${record.push_id}`}>
            <Button size="small">日志</Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>推送管理</h1>

      <Card
        extra={
          <Link to="/pushes/create">
            <Button type="primary" icon={<PlusOutlined />}>
              创建推送
            </Button>
          </Link>
        }
      >
        <Table
          dataSource={pushes}
          columns={columns}
          rowKey="push_id"
          loading={loading}
          pagination={pagination}
          onChange={(pagination) => setPagination(pagination)}
        />
      </Card>
    </div>
  );
};

export default PushesList;