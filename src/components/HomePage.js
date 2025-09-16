import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import SimpleNavbar from './SimpleNavbar';


const HomePage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [area, setArea] = useState('');

  const handleSearch = () => {
    // Xử lý tìm kiếm
    console.log('Search:', { activeTab, searchLocation, priceRange, area });
  };

  return (
    <div className="homepage">
      {/* Header */}
      <SimpleNavbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="stars"></div>
          <div className="house-illustration"></div>
        </div>
        <Container>
          <Row>
            <Col lg={6}>
              <div className="hero-content">
                <h1 className="hero-title">
                  TÌM NHANH, KIẾM DỄ<br />
                  <span className="highlight">TRỌ MỚI HOÀ LẠC</span>
                </h1>
                <p className="hero-subtitle">
                  Trang thông tin và cho thuê phòng trọ nhanh chóng, hiệu quả với hơn 500 tin đăng mới và 30.000 lượt xem mỗi ngày
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <div className="search-container">
                <div className="search-tabs">
                  <button 
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    Tất cả
                  </button>
                  <button 
                    className={`tab ${activeTab === 'room' ? 'active' : ''}`}
                    onClick={() => setActiveTab('room')}
                  >
                    Nhà trọ, phòng trọ
                  </button>
                  
                 
                </div>
                
                <div className="search-form">
                  <div className="search-input">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Bạn muốn tìm trọ ở đâu?"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                  
                  <div className="filter-inputs">
                    <div className="filter-input">
                      <i className="fas fa-dollar-sign"></i>
                      <select 
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                      >
                        <option value="">Mức giá</option>
                        <option value="0-2">Dưới 2 triệu</option>
                        <option value="2-5">2-5 triệu</option>
                        <option value="5-10">5-10 triệu</option>
                        <option value="10+">Trên 10 triệu</option>
                      </select>
                    </div>
                    
                    <div className="filter-input">
                      <i className="fas fa-expand-arrows-alt"></i>
                      <select 
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      >
                        <option value="">Diện tích</option>
                        <option value="0-20">Dưới 20m²</option>
                        <option value="20-30">20-30m²</option>
                        <option value="30-50">30-50m²</option>
                        <option value="50+">Trên 50m²</option>
                      </select>
                    </div>
                </div>
                
                  <Button className="search-btn" onClick={handleSearch}>
                    <i className="fas fa-search"></i>
                    Tìm kiếm
                  </Button>
                  </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Promotional Banners */}
      <section className="promotional-section">
        <Container>
          <Row className="g-4">
            <Col md={4}>
              <div className="promo-banner promo-1">
                <div className="promo-content">
                  <div className="promo-logo">
                    <img src="/images/logo/LogoTo.svg" alt="TRỌ MỚI" />
                  </div>
                  <h3 className="promo-title">KHƠI ĐẦU VÀNG</h3>
                  <h4 className="promo-subtitle">NHẬN QUÀ HOÀNH TRÁNG</h4>
                  <p className="promo-text">NẠP TIỀN LẦN ĐẦU 500K</p>
                  <div className="promo-badge">30%</div>
                </div>
                <div className="promo-illustration">
                  <div className="people-illustration"></div>
                  <div className="gift-box"></div>
                </div>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="promo-banner promo-2">
                <div className="promo-content">
                  <h3 className="promo-title">GÓI QUẢNG CÁO GIẢM ĐẾN 50%</h3>
                  <h4 className="promo-subtitle">CƠ HỘI VÀNG CHO CHỦ TRỌ</h4>
                  <div className="app-badges">
                    <div className="app-badge">
                      <i className="fab fa-google-play"></i>
                      <span>Google Play</span>
                    </div>
                    <div className="app-badge">
                      <i className="fab fa-apple"></i>
                      <span>App Store</span>
                    </div>
                  </div>
                </div>
                <div className="promo-illustration">
                  <div className="phone-illustration"></div>
                  <div className="gift-box"></div>
                </div>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="promo-banner promo-3">
                <div className="promo-content">
                  <h3 className="promo-title">NẠP TIỀN HÔM NAY</h3>
                  <h4 className="promo-subtitle">nhận ngay ƯU ĐÃI 10%</h4>
                  <div className="app-badges">
                    <div className="app-badge">
                      <i className="fab fa-google-play"></i>
                      <span>Google Play</span>
                    </div>
                    <div className="app-badge">
                      <i className="fab fa-apple"></i>
                      <span>App Store</span>
                    </div>
                </div>
              </div>
                <div className="promo-illustration">
                  <div className="jumping-man"></div>
                  <div className="phone-illustration"></div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Hot Listings Section */}
      <section className="hot-listings-section">
        <Container>
          <Row>
            <Col>
              <h2 className="section-title">LỰA CHỌN CHỖ Ở HOT</h2>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={6} lg={4}>
              <div className="listing-card">
                <div className="listing-image">
                  <img src="/images/background/back_nhatro.webp" alt="Phòng trọ" />
                  <div className="hot-badge">HOT</div>
                </div>
                <div className="listing-content">
                  <h3 className="listing-title">Nhà trọ 23 Đức Diễn, Phúc Diễn, Bắc Từ Liêm</h3>
                  <p className="listing-price">2.5 triệu/tháng</p>
                  <p className="listing-area">25m²</p>
                  <div className="listing-features">
                    <span className="feature-tag">Có điều hòa</span>
                    <span className="feature-tag">Wifi miễn phí</span>
                    <span className="feature-tag">Gần trường</span>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col md={6} lg={4}>
              <div className="listing-card">
                <div className="listing-image">
                  <img src="/images/background/back_nhatro.webp" alt="Phòng trọ" />
                  <div className="hot-badge">HOT</div>
                </div>
                <div className="listing-content">
                  <h3 className="listing-title">Phòng trọ Cầu Giấy, Hà Nội</h3>
                  <p className="listing-price">3.2 triệu/tháng</p>
                  <p className="listing-area">30m²</p>
                  <div className="listing-features">
                    <span className="feature-tag">Có điều hòa</span>
                    <span className="feature-tag">Wifi miễn phí</span>
                    <span className="feature-tag">Gần metro</span>
                  </div>
              </div>
              </div>
            </Col>
            
            <Col md={6} lg={4}>
              <div className="listing-card">
                <div className="listing-image">
                  <img src="/images/background/back_nhatro.webp" alt="Phòng trọ" />
                  <div className="hot-badge">HOT</div>
              </div>
                <div className="listing-content">
                  <h3 className="listing-title">Nhà trọ Thanh Xuân, Hà Nội</h3>
                  <p className="listing-price">2.8 triệu/tháng</p>
                  <p className="listing-area">28m²</p>
                  <div className="listing-features">
                    <span className="feature-tag">Có điều hòa</span>
                    <span className="feature-tag">Wifi miễn phí</span>
                    <span className="feature-tag">Gần bệnh viện</span>
      </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
