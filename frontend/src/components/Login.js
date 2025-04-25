import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('登录页面检查令牌:', token ? '已存在' : '不存在');
    
    if (token) {
      console.log('已有令牌，重定向到仪表盘');
      navigate('/dashboard');
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    console.log('尝试登录，用户名:', values.username);
    
    try {
      // 直接使用axios而不是封装的API函数，方便调试
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('password', values.password);
      
      console.log('发送登录请求...');
      const response = await axios.post('http://localhost:8000/api/admin/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('登录响应:', response.data);
      
      if (response.data && response.data.access_token) {
        // 存储令牌和用户信息
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('username', response.data.username || 'admin');
        localStorage.setItem('role', response.data.role || 'admin');
        
        message.success('登录成功，即将跳转...');
        console.log('登录成功，存储的令牌:', response.data.access_token);
        
        // 使用window.location直接跳转，避免React Router问题
        window.location.href = '/dashboard';
      } else {
        console.error('响应中没有access_token:', response.data);
        message.error('登录成功但返回数据格式不正确');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      
      message.error(
        error.response?.data?.detail 
          ? `登录失败: ${error.response.data.detail}` 
          : '登录失败: 请检查用户名和密码'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="Telegram 推送系统管理登录" style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <Form
          name="normal_login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              登录
            </Button>
          </Form.Item>
          
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p>使用管理员账户登录</p>
            <p style={{ fontSize: 12, color: '#999' }}>请确保已创建管理员账户</p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm;