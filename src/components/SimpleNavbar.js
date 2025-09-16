import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './SimpleNavbar.css';
import supabase from '../config/supabaseClient';

const SimpleNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);
        setNotifications([
          { id: 1, title: 'Phòng trọ mới', message: 'Có phòng trọ mới phù hợp với bạn', read: false },
          { id: 2, title: 'Thanh toán', message: 'Hóa đơn tháng 1 đã được tạo', read: true },
          { id: 3, title: 'Hệ thống', message: 'Cập nhật bảo mật mới', read: false }
        ]);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setUser(null);
    setNotifications([]);
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleMobileProfile = () => {
    setIsMobileProfileOpen(!isMobileProfileOpen);
  };

  const closeMobileProfile = () => {
    setIsMobileProfileOpen(false);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handlePostRoom = () => {
    window.location.href = '/admin';
  };
  return (
    <header className="simple-header">
      <Container>
        <Row className="align-items-center">
          <Col md={3}>
            <div className="logo-and-menu d-flex align-items-center">
              <div className="mobile-menu d-md-none me-2">
                <button className={`hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </div>
              <div className="logo">
                <Link to="/" className="logo-link">
                  <img src="/images/logo/LogoTo.svg" alt="TRỌ MỚI" className="logo-img" />
                  <span className="logo-text">TRỌ HOÀ LẠC</span>
                </Link>
              </div>
            </div>
          </Col>
          <Col md={6} className="d-none d-md-block">
            <nav className="main-nav">
              <Link to="/" className="nav-link">Trang chủ</Link>
              
              <Link to="/rooms" className="nav-link">Nhà trọ, phòng trọ</Link>
              <Link to="/" className="nav-link">Ở Ghép</Link>
              <Link to="/" className="nav-link">Blog</Link>
            </nav>
          </Col>
          <Col md={3}>
            <div className="header-actions">
              <div className="action-buttons">
                {isLoggedIn ? (
                  <>
                    {/* Notifications */}
                    <Dropdown align="end" className="notification-dropdown">
                      <Dropdown.Toggle 
                        variant="link" 
                        className="notification-btn"
onClick={(e) => {
                          if (window.innerWidth <= 992) {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = '/profile?section=notifications';
                          }
                        }}
                      >
                        <i className="fas fa-bell"></i>
                        {unreadNotifications > 0 && (
                          <span className="notification-badge">{unreadNotifications}</span>
                        )}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="notification-menu">
                        <div className="notification-header">
                          <h6>Thông báo</h6>
                        </div>
                        {notifications.length > 0 ? (
                          notifications.map(notification => (
                            <Dropdown.Item 
                              key={notification.id} 
                              className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            >
                              <div className="notification-content">
                                <div className="notification-title">{notification.title}</div>
                                <div className="notification-message">{notification.message}</div>
                              </div>
                            </Dropdown.Item>
                          ))
                        ) : (
                          <Dropdown.Item disabled>Không có thông báo</Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>

                    {/* Profile Dropdown */}
                    <Dropdown align="end" className="profile-dropdown">
                      <Dropdown.Toggle variant="link" className="profile-btn">
                        <img 
                          src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '/images/logo/LogoTo.svg'} 
                          alt="Profile" 
                          className="profile-avatar"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth <= 992) {
                              toggleMobileProfile();
                            }
                          }}
                        />
                        <span className="profile-name">
                          {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
                        </span>
                        {/* <i className="fas fa-chevron-down"></i> */}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="profile-menu">
                        <Dropdown.Item as={Link} to="/profile">
                          <i className="fas fa-user"></i>
                          Hồ sơ cá nhân
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/my-bookings">
                          <i className="fas fa-calendar"></i>
                          Đặt phòng của tôi
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/profile?section=favorites">
                          <i className="fas fa-heart"></i>
                          Danh mục phòng yêu thích
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout}>
                          <i className="fas fa-sign-out-alt"></i>
                          Đăng xuất
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>

                    <Button className="post-btn" onClick={handlePostRoom}>
                      <i className="fas fa-plus-circle"></i>
                      Thêm phòng trọ
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="action-link">
                      <i className="fas fa-arrow-right"></i>
                      Đăng nhập
                    </Link>
                    <Link to="/register" className="action-link">
                      <i className="fas fa-user-plus"></i>
                      Đăng ký
                    </Link>
                    <Button className="post-btn" onClick={handlePostRoom}>
                      <i className="fas fa-plus-circle"></i>
                      Thêm phòng trọ
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Mobile Side Menu */}
      <div className={`mobile-side-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>
        <div className="mobile-menu-drawer">
          <div className="mobile-menu-header">
            <button className="mobile-menu-close" onClick={toggleMobileMenu}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="mobile-menu-content">
            {isLoggedIn && (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <img 
                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '/images/logo/LogoTo.svg'} 
                    alt="Profile" 
                    className="mobile-user-avatar"
                  />
                  <div className="mobile-user-details">
                    <div className="mobile-user-name">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
                    </div>
                    <div className="mobile-user-email">{user?.email}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mobile-nav-links">
              <Link to="/" className="mobile-nav-link" onClick={toggleMobileMenu}>
                Trang chủ
              </Link>
              
              <Link to="/rooms" className="mobile-nav-link" onClick={toggleMobileMenu}>
                Nhà trọ, phòng trọ
              </Link>
              
              <Link to="/" className="mobile-nav-link" onClick={toggleMobileMenu}>
                Ở Ghép
              </Link>
              <Link to="/" className="mobile-nav-link" onClick={toggleMobileMenu}>
                Blog
              </Link>
              
              {/* {isLoggedIn ? (
                <>
                  <div className="mobile-nav-divider"></div>
                  <Link to="/profile" className="mobile-nav-link" onClick={toggleMobileMenu}>
                    <i className="fas fa-user"></i>
                    Hồ sơ cá nhân
                  </Link>
                  <Link to="/my-bookings" className="mobile-nav-link" onClick={toggleMobileMenu}>
                    <i className="fas fa-calendar"></i>
                    Đặt phòng của tôi
                  </Link>
                  <Link to="/profile?section=favorites" className="mobile-nav-link" onClick={toggleMobileMenu}>
                    <i className="fas fa-heart"></i>
                    Danh mục phòng yêu thích
                  </Link>
                  <div className="mobile-nav-link mobile-notifications" onClick={toggleMobileMenu}>
                    <i className="fas fa-bell"></i>
                    Thông báo
                    {unreadNotifications > 0 && (
                      <span className="mobile-notification-badge">{unreadNotifications}</span>
                    )}
                  </div>
                  <div className="mobile-nav-link mobile-logout" onClick={() => {
                    toggleMobileMenu();
                    handleLogout();
                  }}>
                    <i className="fas fa-sign-out-alt"></i>
                    Đăng xuất
                  </div>
                </>
              ) : (
                <>
                  <div className="mobile-nav-divider"></div>
                  <Link to="/login" className="mobile-nav-link" onClick={toggleMobileMenu}>
                    <i className="fas fa-arrow-right"></i>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="mobile-nav-link" onClick={toggleMobileMenu}>
                    <i className="fas fa-user-plus"></i>
                    Đăng ký
                  </Link>
                </>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Profile Sidebar */}
      {isLoggedIn && (
        <div className={`mobile-profile-sidebar ${isMobileProfileOpen ? 'open' : ''}`}>
          <div className="mobile-profile-overlay" onClick={closeMobileProfile}></div>
          <div className="mobile-profile-drawer">
            {/* Header with close button */}
            <div className="mobile-profile-header">
              <div className="mobile-profile-user-info">
                <img 
                  src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '/images/logo/LogoTo.svg'} 
                  alt="Avatar" 
                  className="mobile-profile-avatar"
                />
                <div className="mobile-profile-user-details">
                  <div className="mobile-profile-user-name">
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
                  </div>
                  <div className="mobile-profile-user-id">
                    ID: #{user?.id?.slice(0, 8) || '35501'}
                  </div>
                </div>
              </div>
              <button className="mobile-profile-close" onClick={closeMobileProfile}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Navigation Menu */}
            <div className="mobile-profile-nav">
              <Link to="/profile" className="mobile-profile-nav-link" onClick={closeMobileProfile}>
                <i className="fas fa-user"></i>
                Hồ sơ cá nhân
              </Link>
              <Link to="/profile?section=account" className="mobile-profile-nav-link" onClick={closeMobileProfile}>
                <i className="fas fa-user-circle"></i>
                Thông tin tài khoản
              </Link>
              <Link to="/my-bookings" className="mobile-profile-nav-link" onClick={closeMobileProfile}>
                <i className="fas fa-suitcase"></i>
                Đặt phòng của tôi
              </Link>
              
              <Link to="/profile?section=reviews" className="mobile-profile-nav-link" onClick={closeMobileProfile}>
                <i className="fas fa-star"></i>
                Quản lý đánh giá
              </Link>
              <Link to="/profile?section=favorites" className="mobile-profile-nav-link" onClick={closeMobileProfile}>
                <i className="fas fa-heart"></i>
                Danh mục phòng yêu thích
              </Link>
              <Link to="/profile?section=notifications" className="mobile-profile-nav-link" onClick={closeMobileProfile}>
                <i className="fas fa-bell"></i>
                Thông báo
              </Link>
              
              <div className="mobile-profile-nav-link logout" onClick={() => {
                closeMobileProfile();
                handleLogout();
              }}>
                <i className="fas fa-sign-out-alt"></i>
                Đăng xuất
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <div className="bottom-nav-mobile d-md-none">
        <Link to="/rooms" className="bottom-nav-item active">
          <i className="fas fa-home"></i>
          Phòng trọ
        </Link>
        <Link to="/rooms" className="bottom-nav-item">
          <i className="fas fa-building"></i>
          Ở Ghép
        </Link>
        <Link to="/rooms" className="bottom-nav-item">
          <i className="fas fa-home"></i>
          Căn hộ
        </Link>
        <Link to="/" className="bottom-nav-item">
          <i className="fas fa-video"></i>
          Review
        </Link>
      </div>
    </header>
  );
};

export default SimpleNavbar;
