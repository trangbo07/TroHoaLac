import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Nav } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './ProfilePage.css';
import supabase from '../config/supabaseClient';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '',
    phone: '',
    email: ''
  });
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Format date for form input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !currentUser) {
          setError('Bạn chưa đăng nhập');
          setLoading(false);
          return;
        }
        setUser(currentUser);
        // Fetch profile from public table 'profiles' (id == auth user id)
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, name, phone, "DoB"')
          .eq('id', currentUser.id)
          .limit(1)
          .maybeSingle();
        if (profileRows) setProfile(profileRows);
        const meta = currentUser.user_metadata || {};
        setFormData({
          fullName: profileRows?.name || meta.full_name || meta.name || '',
          gender: meta.gender || 'Nam',
          dateOfBirth: formatDateForInput(profileRows?.DoB || meta.date_of_birth || meta.birthday || ''),
          phone: String(profileRows?.phone || currentUser.phone || meta.phone || meta.phone_number || ''),
          email: currentUser.email || ''
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Check for section parameter in URL
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['personal', 'account', 'storage', 'reviews', 'favorites', 'notifications'].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const displayName = profile?.name || user?.user_metadata?.nickname|| user?.user_metadata?.name || user?.email || 'Người dùng';
  const email = user?.email || '';
  const phone = formData.phone || profile?.phone || user?.phone || user?.user_metadata?.phone || user?.user_metadata?.phone_number || '';
  const dobRaw = formData.dateOfBirth || profile?.DoB || user?.user_metadata?.date_of_birth || user?.user_metadata?.birthday || '';
  const dobDisplay = dobRaw ? new Date(dobRaw).toLocaleDateString('vi-VN') : '';
  
  // Get avatar from multiple sources (Google, Facebook, etc.)
  const getAvatarUrl = (user) => {
    if (!user) return '/images/logo/LogoTo.svg';
    
    // Check user_metadata for avatar
    const metadata = user.user_metadata || {};
    const avatarSources = [
      metadata.avatar_url,
      metadata.picture,
      metadata.photo_url,
      metadata.image_url,
      metadata.profile_picture,
      metadata.avatar,
      // Google specific
      metadata.avatar_url,
      // Facebook specific  
      metadata.picture?.data?.url,
      // Direct URL from identities
      user.identities?.[0]?.identity_data?.avatar_url,
      user.identities?.[0]?.identity_data?.picture
    ];
    
    // Find first valid URL
    for (const url of avatarSources) {
      if (url && typeof url === 'string' && url.startsWith('http')) {
        return url;
      }
    }
    
    return '/images/logo/LogoTo.svg';
  };
  
  const avatarUrl = getAvatarUrl(user);
  
  // Get provider info for avatar fallback
  const getProviderInfo = (user) => {
    if (!user?.identities || user.identities.length === 0) return null;
    const identity = user.identities[0];
    return {
      provider: identity.provider,
      name: identity.provider === 'email' ? 'Email' : 
            identity.provider === 'google' ? 'Google' :
            identity.provider === 'facebook' ? 'Facebook' :
            identity.provider === 'github' ? 'GitHub' : 'Other'
    };
  };
  
  const providerInfo = getProviderInfo(user);
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Chưa đăng nhập');
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          name: formData.fullName,
          phone: formData.phone,
          DoB: formData.dateOfBirth
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
      // Also keep auth metadata in sync so UI can read even if RLS blocks profiles
      await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          phone_number: formData.phone,
          date_of_birth: formData.dateOfBirth,
          birthday: formData.dateOfBirth
        }
      });
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };


  const handleMobileNavigation = (section, route = null) => {
    if (route) {
      navigate(route);
    } else {
      setActiveSection(section);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="text-center text-danger">{error}</div>
      </Container>
    );
  }

  return (
    <div className="profile-page">
      <Container fluid>
        <Row className="g-0">
          {/* Sidebar */}
          <Col md={3} className="profile-sidebar">
            <div className="profile-sidebar-content">
              {/* User Info */}
              <div className="profile-user-info">
                <div className="profile-avatar-container">
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="profile-user-avatar"
                />
                  {providerInfo && (
                    <div className={`profile-provider-badge ${providerInfo.provider}`}>
                      {providerInfo.provider === 'google' && (
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {providerInfo.provider === 'facebook' && (
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      {providerInfo.provider === 'email' && (
                        <i className="fas fa-envelope" style={{color: '#6366f1', fontSize: '10px'}}></i>
                      )}
                    </div>
                  )}
                </div>
                <div className="profile-user-details">
                  <h6 className="profile-user-name">{displayName}</h6>
                  <div className="profile-user-id">ID: #{user?.id?.slice(0, 8) || '35501'}</div>
                  {providerInfo && (
                    <div className="profile-user-provider">
                      <small className="text-muted">
                        Đăng nhập qua {providerInfo.name}
                      </small>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Menu */}
              <Nav className="profile-nav">
                 <Nav.Item>
                   <Nav.Link 
                     className={`profile-nav-link ${activeSection === 'personal' ? 'active' : ''}`}
                     onClick={() => handleMobileNavigation('personal')}
                   >
                     <i className="fas fa-user"></i>
                     Hồ sơ cá nhân
                   </Nav.Link>
                 </Nav.Item>
                 <Nav.Item>
                   <Nav.Link 
                     className={`profile-nav-link ${activeSection === 'account' ? 'active' : ''}`}
                     onClick={() => handleMobileNavigation('account')}
                   >
                     <i className="fas fa-user-circle"></i>
                     Thông tin tài khoản
                   </Nav.Link>
                 </Nav.Item>
                 <Nav.Item>
                   <Nav.Link 
                     className={`profile-nav-link ${activeSection === 'bookings' ? 'active' : ''}`}
                     onClick={() => handleMobileNavigation('bookings', '/my-bookings')}
                   >
                     <i className="fas fa-suitcase"></i>
                     Đặt phòng của tôi
                   </Nav.Link>
                 </Nav.Item>
                
                 <Nav.Item>
                   <Nav.Link 
                     className={`profile-nav-link ${activeSection === 'reviews' ? 'active' : ''}`}
                     onClick={() => handleMobileNavigation('reviews')}
                   >
                     <i className="fas fa-star"></i>
                     Quản lý đánh giá
                   </Nav.Link>
                 </Nav.Item>
                 <Nav.Item>
                   <Nav.Link 
                     className={`profile-nav-link ${activeSection === 'favorites' ? 'active' : ''}`}
                     onClick={() => handleMobileNavigation('favorites')}
                   >
                     <i className="fas fa-heart"></i>
                     Danh mục phòng yêu thích
                   </Nav.Link>
                 </Nav.Item>
                 <Nav.Item>
                   <Nav.Link 
                     className={`profile-nav-link ${activeSection === 'notifications' ? 'active' : ''}`}
                     onClick={() => handleMobileNavigation('notifications')}
                   >
                     <i className="fas fa-bell"></i>
                     Thông báo
                   </Nav.Link>
                 </Nav.Item>
                 
                 
                 <Nav.Item>
                   <Nav.Link 
                     className="profile-nav-link profile-nav-logout"
                     onClick={handleLogout}
                   >
                     <i className="fas fa-sign-out-alt"></i>
                     Đăng xuất
                   </Nav.Link>
                 </Nav.Item>
              </Nav>
            </div>
          </Col>

          {/* Main Content */}
          <Col md={9} className="profile-main">
            <div className="profile-content">
              {activeSection === 'personal' && (
                <div>
                  <h2 className="profile-section-title">THÔNG TIN CÁ NHÂN</h2>
                  <p className="profile-section-desc">
                    Cập nhật thông tin của bạn và tìm hiểu các thông tin này được sử dụng ra sao.
                  </p>

                  <Form onSubmit={handleSubmit} className="profile-form">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Họ tên</Form.Label>
                          <Form.Control
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                           
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Giới tính</Form.Label>
                          <Form.Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ngày sinh</Form.Label>
                          <Form.Control
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            placeholder="Vui lòng chọn"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Số điện thoại</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Nhập số điện thoại"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Nhập email"
                            readOnly
                          />
                          <Form.Text className="text-muted">
                            Email không thể thay đổi
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button 
                      type="submit" 
                      className="profile-submit-btn"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang cập nhật...
                        </>
                      ) : (
                        'Cập nhật'
                      )}
                    </Button>
                  </Form>
                </div>
              )}

              {activeSection === 'account' && (
                <div>
                  <h2 className="profile-section-title">THÔNG TIN TÀI KHOẢN</h2>
                  <div className="account-info">
                    <Row>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-envelope"></i> Email</h6>
                          <p>{email || 'Chưa cập nhật'}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-phone"></i> Số điện thoại</h6>
                          <p>{phone || 'Chưa cập nhật'}</p>
                          {profile?.phone && (
                            <small className="text-success">
                              <i className="fas fa-check-circle"></i> Đã thêm
                            </small>
                          )}
                        </div>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-id-card"></i> User ID</h6>
                          <p className="text-muted small">{user?.id || 'N/A'}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-user-tag"></i> Vai trò</h6>
                          <p><Badge bg="info">{profile?.role || user?.role || 'authenticated'}</Badge></p>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-birthday-cake"></i> Ngày sinh</h6>
                          <p>{dobDisplay || 'Chưa cập nhật'}</p>
                          {dobDisplay && (
                            <small className="text-success">
                              <i className="fas fa-check-circle"></i> Đã cập nhật
                            </small>
                          )}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-calendar-plus"></i> Ngày tạo profile</h6>
                          <p>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : 'N/A'}</p>
                        </div>
                      </Col>
                    </Row>

                    <hr />

                    <h5 className="mb-3">Thông tin xác thực</h5>
                    <Row>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-calendar-plus"></i> Ngày tạo tài khoản</h6>
                          <p>{formatDate(user?.created_at)}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-calendar-check"></i> Cập nhật lần cuối</h6>
                          <p>{formatDate(user?.updated_at)}</p>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-envelope-check"></i> Email đã xác thực</h6>
                          <p>
                            {user?.email_confirmed_at ? (
                              <Badge bg="success">
                                <i className="fas fa-check"></i> Đã xác thực
                              </Badge>
                            ) : (
                              <Badge bg="warning">
                                <i className="fas fa-exclamation"></i> Chưa xác thực
                              </Badge>
                            )}
                          </p>
                          {user?.email_confirmed_at && (
                            <small className="text-muted">
                              {formatDate(user.email_confirmed_at)}
                            </small>
                          )}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-phone-check"></i> SĐT đã xác thực</h6>
                          <p>
                            {user?.phone_confirmed_at ? (
                              <Badge bg="success">
                                <i className="fas fa-check"></i> Đã xác thực
                              </Badge>
                            ) : (
                              <Badge bg="warning">
                                <i className="fas fa-exclamation"></i> Chưa xác thực
                              </Badge>
                            )}
                          </p>
                          {user?.phone_confirmed_at && (
                            <small className="text-muted">
                              {formatDate(user.phone_confirmed_at)}
                            </small>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-sign-in-alt"></i> Đăng nhập lần cuối</h6>
                          <p>{formatDate(user?.last_sign_in_at)}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="account-info-item">
                          <h6><i className="fas fa-shield-alt"></i> Trạng thái tài khoản</h6>
                          <p>
                            <Badge bg={user?.aud === 'authenticated' ? 'success' : 'secondary'}>
                              {user?.aud === 'authenticated' ? 'Hoạt động' : 'Không xác định'}
                            </Badge>
                          </p>
                        </div>
                      </Col>
                    </Row>

                    {/* User Metadata - Formatted */}
                    {user?.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                      <>
                        <hr />
                        <h5 className="mb-3">Thông tin bổ sung từ OAuth</h5>
                        <Row>
                          {user.user_metadata.full_name && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-user me-2"></i>Họ tên đầy đủ</h6>
                                <p>{user.user_metadata.full_name}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.nickname && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-at me-2"></i>Nickname</h6>
                                <p>{user.user_metadata.nickname}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.phone && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-phone me-2"></i>Số điện thoại (OAuth)</h6>
                                <p>{user.user_metadata.phone}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.phone_number && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-mobile-alt me-2"></i>Số điện thoại</h6>
                                <p>{user.user_metadata.phone_number}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.date_of_birth && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-birthday-cake me-2"></i>Ngày sinh (OAuth)</h6>
                                <p>{user.user_metadata.date_of_birth}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.birthday && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-calendar me-2"></i>Ngày sinh</h6>
                                <p>{user.user_metadata.birthday}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.birthday_date && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-calendar-alt me-2"></i>Ngày sinh (Facebook)</h6>
                                <p>{user.user_metadata.birthday_date}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.gender && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-venus-mars me-2"></i>Giới tính (OAuth)</h6>
                                <p>{user.user_metadata.gender}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.address && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-map-marker-alt me-2"></i>Địa chỉ (OAuth)</h6>
                                <p>{user.user_metadata.address}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.location && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-location-dot me-2"></i>Vị trí</h6>
                                <p>{user.user_metadata.location}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.hometown?.name && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-home me-2"></i>Quê quán (Facebook)</h6>
                                <p>{user.user_metadata.hometown.name}</p>
                              </div>
                            </Col>
                          )}
                          {user.user_metadata.location?.name && (
                            <Col md={6}>
                              <div className="account-info-item">
                                <h6><i className="fas fa-map-marker-alt me-2"></i>Vị trí hiện tại (Facebook)</h6>
                                <p>{user.user_metadata.location.name}</p>
                              </div>
                            </Col>
                          )}
                        </Row>
                        
                      </>
                    )}


                    {/* Identities */}
                    {user?.identities && user.identities.length > 0 && (
                      <>
                        <hr />
                        <h5 className="mb-3">Lịch sử đăng nhập</h5>
                        {user.identities.map((identity, index) => (
                          <div key={index} className="account-info-item mb-3">
                            <h6 className="d-flex align-items-center">
                              {identity.provider === 'email' && (
                                <i className="fas fa-envelope me-2" style={{color: '#6366f1'}}></i>
                              )}
                              {identity.provider === 'google' && (
                                <svg className="me-2" width="16" height="16" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              )}
                              {identity.provider === 'facebook' && (
                                <svg className="me-2" width="16" height="16" viewBox="0 0 24 24">
                                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              )}
                              {identity.provider === 'github' && (
                                <i className="fab fa-github me-2" style={{color: '#333'}}></i>
                              )}
                              {!['email', 'google', 'facebook', 'github'].includes(identity.provider) && (
                                <i className="fas fa-user me-2" style={{color: '#6366f1'}}></i>
                              )}
                              <span className="text-capitalize">{identity.provider}</span>
                              <Badge bg="secondary" className="ms-2">Provider</Badge>
                            </h6>
                            <div className="row">
                              <div className="col-md-4">
                                <small className="text-muted d-block">
                                  <i className="fas fa-calendar-plus me-1"></i>
                                  Tạo: {formatDate(identity.created_at)}
                                </small>
                              </div>
                              <div className="col-md-4">
                                <small className="text-muted d-block">
                                  <i className="fas fa-calendar-check me-1"></i>
                                  Cập nhật: {formatDate(identity.updated_at)}
                                </small>
                              </div>
                              <div className="col-md-4">
                                <small className="text-muted d-block">
                                  <i className="fas fa-sign-in-alt me-1"></i>
                                  Đăng nhập cuối: {formatDate(identity.last_sign_in_at)}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'storage' && (
                <div>
                  <h2 className="profile-section-title">THÔNG TIN LƯU TRÚ</h2>
                  <p>Chức năng đang được phát triển...</p>
                </div>
              )}

              {activeSection === 'reviews' && (
                <div>
                  <h2 className="profile-section-title">QUẢN LÝ ĐÁNH GIÁ</h2>
                  <p>Chức năng đang được phát triển...</p>
                </div>
              )}

              {activeSection === 'favorites' && (
                <div>
                  <h2 className="profile-section-title">Danh mục phòng yêu thích</h2>
                  <p>Chức năng đang được phát triển...</p>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div>
                  <h2 className="profile-section-title">THÔNG BÁO</h2>
                  <p>Chức năng đang được phát triển...</p>
                </div>
              )}


            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProfilePage;
