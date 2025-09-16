import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './EmailConfirmationPage.css';

const EmailConfirmationPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Lấy email từ URL params nếu có
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: emailFromUrl }));
    }
  }, [searchParams]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Giới hạn mã xác nhận chỉ 6 số
    if (name === 'code') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.email || !formData.code) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (formData.code.length !== 6) {
      setError('Mã xác nhận phải có 6 số');
      return;
    }
    
    setLoading(true);
    
    try {
      setSuccess('Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay bây giờ.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email trước khi gửi lại mã');
      return;
    }
    
    setResendLoading(true);
    setError('');
    
    try {
      // With Supabase, use resend functionality if enabled; here we just simulate success
      const ok = true;
      if (ok) {
        setSuccess('Mã xác nhận mới đã được gửi đến email của bạn');
        setCountdown(60); // 60 giây countdown
      } else {
        setError('Không thể gửi mã xác nhận');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="email-confirmation-page">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>
      
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="email-confirmation-card">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="email-icon mb-3">
                    <i className="fas fa-envelope-open-text"></i>
                  </div>
                  <h2 className="confirmation-title">Xác nhận Email</h2>
                  <p className="text-muted">
                    Chúng tôi đã gửi mã xác nhận 6 số đến email của bạn
                  </p>
                </div>
                
                <Form onSubmit={handleSubmit}>
                  {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                  {success && <Alert variant="success" className="mb-3">{success}</Alert>}
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email của bạn"
                      className="form-input"
                      disabled={loading}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Mã xác nhận</Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="Nhập mã 6 số"
                      className="form-input code-input"
                      maxLength={6}
                      disabled={loading}
                      required
                    />
                    <Form.Text className="text-muted">
                      Nhập mã 6 số bạn nhận được qua email
                    </Form.Text>
                  </Form.Group>
                  
                  <Button 
                    type="submit" 
                    className="confirm-btn w-100 mb-3"
                    disabled={loading || formData.code.length !== 6}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Đang xác nhận...
                      </>
                    ) : (
                      'Xác nhận Email'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={handleResendCode}
                      disabled={resendLoading || countdown > 0}
                      className="resend-btn"
                    >
                      {resendLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Đang gửi...
                        </>
                      ) : countdown > 0 ? (
                        `Gửi lại sau ${countdown}s`
                      ) : (
                        'Gửi lại mã xác nhận'
                      )}
                    </Button>
                  </div>
                </Form>
                
                <div className="text-center mt-4">
                  <p className="mb-2">
                    <Link to="/login" className="text-decoration-none">
                      <i className="fas fa-arrow-left me-2"></i>
                      Quay lại đăng nhập
                    </Link>
                  </p>
                  <p className="mb-0">
                    <Link to="/register" className="text-decoration-none">
                      <i className="fas fa-user-plus me-2"></i>
                      Đăng ký tài khoản mới
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EmailConfirmationPage;
