import React, { useEffect, useState } from 'react';
import { Table, Card, message, Tag } from 'antd';
import { getLogs, getPushLogs } from '../services/api';
import moment from 'moment';
import { useParams } from 'react-router-dom';

const LogsList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const { pushId } = useParams();

  useEffect(() => {
    fetchLogs();
  }, [pagination.current, pagination.pageSize, pushId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let response;

      if (pushId) {
        // 如果有 pushId，则获取特定推送的日志
        response = await getPushLogs(pushId);
      } else {
        // 否则获取所有日志
        response = await getLogs({
          skip: (pagination.current - 1) * pagination.pageSize,
          limit: pagination.pageSize
        });
      }

      setLogs(response.data);
      setPagination({
        ...pagination,
        total: response.headers['x-total-count'] || response.data.length
      });
    } catch (error) {
      console.error('获取日志失败:', error);
      message.error('获取日志失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '日志ID',
      dataIndex: 'log_id',
      key: 'log_id',
    },
    {
      title: '推送ID',
      dataIndex: 'push_id',
      key: 'push_id',
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        let text = '';

        switch (status) {
          case 'sent':
            color = 'success';
            text = '已发送';
            break;
          case 'delivered':
            color = 'processing';
            text = '已送达';
            break;
          case 'read':
            color = 'blue';
            text = '已读';
            break;
          case 'failed':
            color = 'error';
            text = '失败';
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
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      render: (text) => text || '-',
    },
    {
      title: '发送时间',
      dataIndex: 'sent_at',
      key: 'sent_at',
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '送达时间',
      dataIndex: 'delivered_at',
      key: 'delivered_at',
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '已读时间',
      dataIndex: 'read_at',
      key: 'read_at',
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>{pushId ? `推送 #${pushId} 的日志` : '所有日志'}</h1>

      <Card>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="log_id"
          loading={loading}
          pagination={pagination}
          onChange={(pagination) => setPagination(pagination)}
        />
      </Card>
    </div>
  );
};

export default LogsList;