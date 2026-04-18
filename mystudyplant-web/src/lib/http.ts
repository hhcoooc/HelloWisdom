import axios from 'axios';

// 创建 axios 实例
const http = axios.create({
  // 改为相对路径，配合 Nginx/Ingress 转发，彻底解决跨域与环境变量打包写死问题
  baseURL: '/api', 
  timeout: 10000,
});

// 请求拦截器：自动注入 Sa-Token 下发的 studytoken
http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('studytoken');
    if (token && config.headers) {
      config.headers['studytoken'] = token;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 响应拦截器：统一错误处理（例如 401）
http.interceptors.response.use((response) => {
  const data = response.data;
  if (data && data.code && data.code !== 200) {
    if (data.code === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('studytoken');
        // 移除全局的 alert 和 window.location 强制跳转，交由组件自行通过 AuthModal 处理
        // window.dispatchEvent(new CustomEvent('auth-required')); // 若未来需要全局监听，可解开此注释
      }
    } else if (
      data.code === 403 || 
      String(data.msg || '').includes('角色') || 
      String(data.msg || '').includes('权限') || 
      String(data.msg || '').includes('封禁')
    ) {
      // 像保镖一样拦截：如果没有角色权限、或者是 403、或者是账号被封禁
      if (typeof window !== 'undefined') {
        alert(data.msg || '⚠️ 访问被拒绝：您的账号没有执行此操作的权限或已被封禁！');
        window.location.href = '/'; // 强制踢回前台首页
      }
    }
    // 把错误抛出去，这样前端的 catch 块就能接到了
    return Promise.reject(new Error(data.msg || '操作失败'));
  }
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('studytoken');
      // 移除强制跳转，留给各页面 / 组件去捕获 401 显示优雅的模态框
    }
  } else if (error.response?.status === 403) {
    if (typeof window !== 'undefined') {
       alert('⚠️ 访问被拒绝：您的账号没有执行此操作的权限！');
       window.location.href = '/';
    }
  }
  return Promise.reject(error);
});

export default http;
