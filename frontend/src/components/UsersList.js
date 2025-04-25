import React, { useEffect, useState } from 'react';
import { Table, Switch, Input, Button, Card, message } from 'antd';
import { getUsers, updateUserStatus } from '../services/api';
import moment from 'moment';

const { Search } = Input;

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize
      });
      setUsers(response.data);
      setPagination({
        ...pagination,
        total: response.headers['x-total-count'] || response.data.length
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (checked, userId) => {
    try {
      await updateUserStatus(userId, checked);
      message.success(`用户状态已${checked ? '激活' : '停用'}`);
      fetchUsers();
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败');
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // 这里需要后端支持搜索功能，目前先简单前端过滤
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: 'Telegram ID',
      dataIndex: 'telegram_id',
      key: 'telegram_id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text) => text || '未设置',
    },
    {
      title: '名字',
      dataIndex: 'first_name',
      key: 'first_name',
      render: (text) => text || '未设置',
    },
    {
      title: '姓氏',
      dataIndex: 'last_name',
      key: 'last_name',
      render: (text) => text || '未设置',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={(checked) => handleStatusChange(checked, record.user_id)}
        />
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '最后交互',
      dataIndex: 'last_interaction_at',
      key: 'last_interaction_at',
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '从未',
    },
  ];

  const filteredUsers = searchText
    ? users.filter(user =>
        (user.username && user.username.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.telegram_id && user.telegram_id.toString().includes(searchText))
      )
    : users;

  return (
    <div style={{ padding: '24px' }}>
      <h1>用户管理</h1>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索用户"
            allowClear
            enterButton
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button type="primary" onClick={fetchUsers} style={{ marginLeft: 8 }}>
            刷新
          </Button>
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="user_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default UsersList;