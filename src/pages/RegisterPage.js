import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import supabase from '../config/supabaseClient';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName }
        }
      });
      if (error) {
        setError(error.message || 'Có lỗi xảy ra khi đăng ký');
      } else {
        if (data.user?.email_confirmed_at) {
          setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
          setTimeout(() => navigate(`/email-confirmation?email=${encodeURIComponent(formData.email)}`), 1500);
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    if (loading) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) setError(error.message);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="register-page">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>
      
      <div className="register-container">
        <div className="register-form">
          <h1 className="register-title">Đăng ký</h1>
          
          <Form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <Form.Group className="form-group">
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Họ và tên"
                className="form-input"
                tabIndex="1"
                autoComplete="name"
                disabled={loading}
              />
            </Form.Group>
            
            <Form.Group className="form-group">
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="form-input"
                tabIndex="2"
                autoComplete="email"
                disabled={loading}
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
                  tabIndex="3"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  disabled={loading}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </Form.Group>
            
            <Form.Group className="form-group">
              <div className="password-container">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu"
                  className="form-input"
                  tabIndex="4"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  disabled={loading}
                >
                  <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </Form.Group>
            
            <Button 
              type="submit" 
              className="register-btn" 
              tabIndex="5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Đang đăng ký...
                </>
              ) : (
                'Đăng ký'
              )}
            </Button>
          </Form>

          {/* Social Login Separator */}
          <div className="social-separator">
            <hr className="separator-line" />
            <span className="separator-text">Hoặc đăng ký bằng</span>
            <hr className="separator-line" />
          </div>

          {/* Social Login Buttons */}
          <div className="social-login-buttons">
            <Button 
              type="button"
              className="social-btn google-btn"
              onClick={() => handleSocialLogin('google')}
              tabIndex="6"
              disabled={loading}
            >
              <i className="fab fa-google"></i>
              Google
            </Button>
            <Button 
              type="button"
              className="social-btn facebook-btn"
              onClick={() => handleSocialLogin('facebook')}
              tabIndex="7"
              disabled={loading}
            >
              <i className="fab fa-facebook-f"></i>
              Facebook
            </Button>
          </div>
          
          <div className="login-link">
            <p>
              Đã có tài khoản? <Link to="/login" tabIndex="8">Đăng nhập ngay</Link>
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

export default RegisterPage;
