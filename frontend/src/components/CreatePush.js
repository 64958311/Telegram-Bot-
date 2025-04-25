import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Radio, DatePicker, message, Table, Tag, Space, Divider, Tabs } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createPush, getUsers, sendPush } from '../services/api';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { TabPane } = Tabs;

const CreatePush = () => {
  const [form] = Form.useForm();
  const [messageType, setMessageType] = useState('text');
  const [formatType, setFormatType] = useState('plain');
  const [timingOption, setTimingOption] = useState('now');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [buttons, setButtons] = useState([]);
  const [previewContent, setPreviewContent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getUsers({ active_only: true, limit: 1000 });
      setUsers(response.data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleContentChange = (e) => {
    setPreviewContent(e.target.value || '');
  };

  const handleSubmit = async (values) => {
    if (selectedUsers.length === 0) {
      message.error('请选择至少一个接收用户');
      return;
    }
  
    setLoading(true);
    try {
      console.log('准备创建推送，表单数据:', values);
      
      // 构建推送数据
      const pushData = {
        title: values.title,
        content: values.content,
        content_type: messageType,
        media_url: values.media_url || null,
        target_user_ids: selectedUsers,
        use_markdown: formatType === 'markdown'
      };
  
      // 处理按钮数据 - 关键修改：确保按钮数据是字符串
      if (buttons && buttons.length > 0) {
        // 过滤有效按钮
        const validButtons = buttons.filter(btn => btn.text && btn.url);
        if (validButtons.length > 0) {
          console.log('有效的按钮数据:', validButtons);
          // 将按钮数组转换为JSON字符串 - 这是关键修复
          pushData.buttons = JSON.stringify(validButtons);
        }
      }
  
      console.log('发送创建推送请求，完整数据:', pushData);
      
      // 发送创建请求
      const response = await createPush(pushData);
      console.log('创建推送响应:', response.data);
      
      // 如果是立即发送，则调用发送API
      if (timingOption === 'now') {
        try {
          console.log(`发送推送 ID: ${response.data.push_id}`);
          const sendResponse = await sendPush(response.data.push_id);
          console.log('发送响应:', sendResponse.data);
          message.success('推送已发送');
        } catch (sendError) {
          console.error('发送推送失败:', sendError);
          
          // 改进错误处理显示
          let errorMessage = '未知错误';
          if (sendError.response && sendError.response.data) {
            errorMessage = sendError.response.data.detail || JSON.stringify(sendError.response.data);
          } else if (sendError.message) {
            errorMessage = sendError.message;
          }
          
          message.error(`发送失败: ${errorMessage}`);
        }
      } else {
        message.success('推送已创建，将按计划发送');
      }
      
      // 导航到推送列表
      navigate('/pushes');
    } catch (error) {
      console.error('创建推送失败:', error);
      
      // 改进错误处理显示
      let errorMessage = '未知错误';
      
      if (error.response) {
        console.error('错误响应:', error.response.status, error.response.data);
        
        // 处理422验证错误
        if (error.response.status === 422 && error.response.data.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // 如果是验证错误数组
            errorMessage = error.response.data.detail
              .map(err => `${err.loc.join('.')}：${err.msg}`)
              .join('; ');
          } else {
            // 如果是单个错误对象
            errorMessage = JSON.stringify(error.response.data.detail);
          }
        } else {
          // 其他类型的响应错误
          errorMessage = error.response.data.detail || JSON.stringify(error.response.data);
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        errorMessage = '服务器无响应，请检查网络连接';
      } else {
        // 请求设置时发生的错误
        errorMessage = error.message;
      }
      
      message.error(`创建推送失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 按钮管理
  const addButton = () => {
    setButtons([...buttons, { text: '', url: '' }]);
  };

  const updateButtonText = (index, value) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], text: value };
    setButtons(newButtons);
  };

  const updateButtonUrl = (index, value) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], url: value };
    setButtons(newButtons);
  };

  const removeButton = (index) => {
    const newButtons = [...buttons];
    newButtons.splice(index, 1);
    setButtons(newButtons);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'user_id',
      key: 'user_id',
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
    },
    {
      title: '最后交互',
      dataIndex: 'last_interaction_at',
      key: 'last_interaction_at',
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '从未',
    },
  ];

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys) => {
      setSelectedUsers(selectedRowKeys);
    },
  };

  // Markdown格式示例
  const markdownExample = `
*粗体文本* 使用 *星号*
_斜体文本_ 使用 _下划线_
[链接文本](https://example.com)
\`代码\` 使用反引号
  `;

  return (
    <div style={{ padding: '24px' }}>
      <h1>创建推送</h1>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入推送标题' }]}
          >
            <Input placeholder="输入推送标题" />
          </Form.Item>
          
          <Form.Item label="内容类型">
            <Radio.Group onChange={(e) => setMessageType(e.target.value)} value={messageType}>
              <Radio.Button value="text">文本</Radio.Button>
              <Radio.Button value="photo">图片</Radio.Button>
              <Radio.Button value="video">视频</Radio.Button>
              <Radio.Button value="document">文档</Radio.Button>
              <Radio.Button value="audio">音频</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          {messageType === 'text' && (
            <Form.Item label="文本格式">
              <Radio.Group onChange={(e) => setFormatType(e.target.value)} value={formatType}>
                <Radio.Button value="plain">普通文本</Radio.Button>
                <Radio.Button value="markdown">Markdown</Radio.Button>
              </Radio.Group>
              {formatType === 'markdown' && (
                <div style={{ marginTop: 8, padding: 10, background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: 3 }}>
                  <p><strong>Markdown示例:</strong></p>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{markdownExample}</pre>
                </div>
              )}
            </Form.Item>
          )}
          
          <Tabs defaultActiveKey="edit">
            <TabPane tab="编辑" key="edit">
              <Form.Item
                name="content"
                label="内容"
                rules={[{ required: true, message: '请输入推送内容' }]}
              >
                <TextArea 
                  rows={6} 
                  placeholder={formatType === 'markdown' ? '支持Markdown格式' : '输入推送内容'} 
                  onChange={handleContentChange}
                />
              </Form.Item>
            </TabPane>
            
            {formatType === 'markdown' && (
              <TabPane tab="预览" key="preview">
                <div style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '2px', 
                  padding: '16px', 
                  minHeight: '150px',
                  backgroundColor: '#fafafa'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: previewContent
                    .replace(/\*([^*]+)\*/g, '<b>$1</b>')  // 粗体
                    .replace(/_([^_]+)_/g, '<i>$1</i>')    // 斜体
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')  // 链接
                    .replace(/`([^`]+)`/g, '<code>$1</code>')  // 代码
                    .split('\n').join('<br />')  // 换行
                  }} />
                </div>
              </TabPane>
            )}
          </Tabs>
          
          {messageType !== 'text' && (
            <Form.Item
              name="media_url"
              label="媒体URL"
              rules={[{ required: true, message: '请输入媒体文件URL' }]}
            >
              <Input placeholder="输入媒体文件URL" />
            </Form.Item>
          )}
          
          <Divider orientation="left">添加按钮 (可选)</Divider>
          <Button 
            type="dashed" 
            onClick={addButton} 
            icon={<PlusOutlined />} 
            style={{ marginBottom: 16 }}
          >
            添加按钮
          </Button>
          
          {buttons.map((btn, index) => (
            <div key={index} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <Input 
                placeholder="按钮文本" 
                value={btn.text} 
                onChange={e => updateButtonText(index, e.target.value)} 
                style={{ width: '30%' }}
              />
              <Input 
                placeholder="URL链接 (例如: https://example.com)" 
                value={btn.url} 
                onChange={e => updateButtonUrl(index, e.target.value)} 
                style={{ width: '60%' }}
              />
              <Button 
                danger 
                onClick={() => removeButton(index)}
                icon={<DeleteOutlined />}
              />
            </div>
          ))}
          
          <Divider orientation="left">发送选项</Divider>
          <Form.Item
            name="timing_option"
            label="发送时间"
            initialValue="now"
          >
            <Radio.Group onChange={(e) => setTimingOption(e.target.value)} value={timingOption}>
              <Radio value="now">立即发送</Radio>
              <Radio value="scheduled">定时发送</Radio>
            </Radio.Group>
          </Form.Item>
          
          {timingOption === 'scheduled' && (
            <Form.Item
              name="scheduled_time"
              label="计划发送时间"
              rules={[{ required: true, message: '请选择计划发送时间' }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
            </Form.Item>
          )}
          
          <Divider orientation="left">接收用户</Divider>
          <Form.Item label="选择接收用户">
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button onClick={() => setSelectedUsers(users.map(u => u.user_id))}>全选</Button>
                <Button onClick={() => setSelectedUsers([])}>清除</Button>
                <span>已选择 {selectedUsers.length} 个用户</span>
              </Space>
            </div>
            
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={users}
              rowKey="user_id"
              loading={loadingUsers}
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建推送
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreatePush;