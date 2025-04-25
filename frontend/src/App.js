import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import 'antd/dist/reset.css';
import moment from 'moment';
import 'moment/locale/zh-cn';

// 组件导入
import AppLayout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UsersList from './components/UsersList';
import PushesList from './components/PushesList';
import CreatePush from './components/CreatePush';
import LogsList from './components/LogsList';

// 设置 moment 语言为中文
moment.locale('zh-cn');

// 受保护的路由
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  console.log('ProtectedRoute 检查令牌:', token ? '有令牌' : '无令牌');
  
  if (!token) {
    console.log('没有令牌，重定向到登录页面');
    return <Navigate to="/login" replace />;
  }
  
  console.log('有令牌，渲染受保护内容');
  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <UsersList />
            </ProtectedRoute>
          } />
          
          <Route path="/pushes" element={
            <ProtectedRoute>
              <PushesList />
            </ProtectedRoute>
          } />
          
          <Route path="/pushes/create" element={
            <ProtectedRoute>
              <CreatePush />
            </ProtectedRoute>
          } />
          
          <Route path="/logs" element={
            <ProtectedRoute>
              <LogsList />
            </ProtectedRoute>
          } />
          
          <Route path="/logs/:pushId" element={
            <ProtectedRoute>
              <LogsList />
            </ProtectedRoute>
          } />
          
          {/* 默认路由 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 捕获所有其他路由 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;