import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // 确保此URL正确
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`发送请求: ${config.method.toUpperCase()} ${config.url}`, config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`接收响应: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('请求错误:', error.request);
    } else {
      console.error('配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);
// 添加错误处理拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 处理500错误但允许继续
    if (error.response && error.response.status === 500 && 
        (error.response.data.detail?.includes('validation') || 
         error.response.config.url.includes('/pushs'))) {
      console.warn('捕获到验证错误，返回空数组');
      // 返回空数组或默认数据结构
      return { data: [] };
    }
    return Promise.reject(error);
  }
);
// 用户相关 API
export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUserStatus = (id, isActive) => api.put(`/users/${id}/status?is_active=${isActive}`);

// 推送相关 API
export const getPushes = (params) => api.get('/pushs', { params });
export const getPush = (id) => api.get(`/pushs/${id}`);
// 推送相关 API
export const createPush = (data) => {
  console.log('调用 createPush API, 数据:', data);
  try {
    return api.post('/pushs', data);
  } catch (error) {
    console.error('createPush API 调用失败:', error);
    throw error;
  }
};
export const updatePush = (id, data) => api.put(`/pushs/${id}`, data);
export const deletePush = (id) => api.delete(`/pushs/${id}`);
export const deletePushMessage = (id) => {
  return api.delete(`/pushs/${id}/message`);
};
export const sendPush = (id) => {
  console.log(`调用 sendPush API, ID: ${id}`);
  try {
    return api.post(`/pushs/${id}/send`);
  } catch (error) {
    console.error('sendPush API 调用失败:', error);
    throw error;
  }
};
export const cancelPush = (id) => api.post(`/pushs/${id}/cancel`);

// 日志相关 API
export const getLogs = (params) => api.get('/logs', { params });
export const getPushLogs = (pushId) => api.get(`/logs/${pushId}`);

// 管理员相关 API
export const login = (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/admin/login', formData);
};

export const getCurrentAdmin = () => api.get('/admin/me');
export const getStats = () => api.get('/admin/stats');

export default api;