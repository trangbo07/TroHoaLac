import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './LoginPage.css';
import supabase from '../config/supabaseClient';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message || 'Đăng nhập thất bại');
        return;
      }
      if (data?.session?.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
      }
      // Ensure we have latest user (some providers may not return user fully here)
      const { data: got } = await supabase.auth.getUser();
      const u = got?.user || data?.user;
      const roleMeta = String(u?.user_metadata?.role || '').trim().toLowerCase();
      console.log('[LOGIN] userId=', u?.id, 'meta.role=', roleMeta);
      if (roleMeta === 'admin') {
        window.location.href = '/admin/dashboard';
        return;
      }
      try {
        let { data: prof } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', u?.id)
          .maybeSingle();
        if (!prof && u?.id) {
          // Tạo profile nếu chưa có (role mặc định renter hoặc từ metadata nếu có)
          const defaultRole = roleMeta || 'renter';
          await supabase.from('profiles').insert({ id: u.id, name: u.email || 'User', role: defaultRole });
          const reget = await supabase.from('profiles').select('id, role').eq('id', u.id).maybeSingle();
          prof = reget.data || prof;
        }
        const roleDb = String(prof?.role || '').trim().toLowerCase();
        console.log('[LOGIN] profiles.role=', roleDb, 'profile=', prof);
        if (roleDb === 'admin') {
          window.location.href = '/admin/dashboard';
          return;
        }
      } catch (_) {}
      window.location.href = '/user-home';
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Lỗi không xác định');
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const redirectTo = `${window.location.origin}/oauth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo }
      });
      if (error) alert(error.message);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="login-page">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>
      
      <div className="login-container">
        <div className="login-form">
          <h1 className="login-title">Đăng nhập</h1>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="form-group">
              <Form.Control
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Tên đăng nhập hoặc email"
                className="form-input"
                tabIndex="1"
                autoComplete="username"
              />
            </Form.Group>
            
            <Form.Group className="form-group">
              <div className="password-container">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mật khẩu"
                  className="form-input"
                  tabIndex="2"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </Form.Group>
            
            <div className="form-options">
              <Form.Check
                type="checkbox"
                label="Ghi nhớ đăng nhập"
                className="remember-check"
                tabIndex="-1"
              />
              <Link to="/forgot-password" className="forgot-link" tabIndex="4">
                Quên mật khẩu?
              </Link>
            </div>
            
            {errorMsg && <div className="error-message">{errorMsg}</div>}
            <Button type="submit" className="login-btn" tabIndex="3" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form>

          {/* Social Login */}
          <div className="social-separator">
            <hr className="separator-line" />
            <span className="separator-text">Hoặc</span>
            <hr className="separator-line" />
          </div>
          <div className="social-login-buttons">
            <Button 
              type="button"
              className="social-btn google-btn"
              onClick={() => handleSocialLogin('google')}
              tabIndex="5"
            >
              <i className="fab fa-google"></i>
              Đăng nhập với Google
            </Button>
          </div>
          
          <div className="signup-link">
            <p>
              Chưa có tài khoản? <Link to="/register" tabIndex="7">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
        
        <div className="back-button-container">
          <Link to="/" className="back-button">
            <i className="fas fa-arrow-left"></i>
            <span>Quay lại</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
