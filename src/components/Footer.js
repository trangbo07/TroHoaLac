import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone, 
  faEnvelope, 
  faMapMarkerAlt,
  faArrowUp
} from '@fortawesome/free-solid-svg-icons';
import { 
  faFacebook, 
  faTiktok, 
  faYoutube
} from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <Container>
        <Row>
          {/* Hệ Thống */}
          <Col lg={3} md={6} className="mb-4">
            <h5 className="footer-title">HỆ THỐNG</h5>
            <ul className="footer-links">
              <li><a href="/">Dành cho chủ trọ</a></li>
              <li><a href="/">Hướng dẫn</a></li>
              <li><a href="/">Liên hệ</a></li>
            </ul>
          </Col>

          {/* Thông Tin */}
          <Col lg={3} md={6} className="mb-4">
            <h5 className="footer-title">THÔNG TIN</h5>
            <ul className="footer-links">
              <li><a href="/">Điều khoản & Cam kết</a></li>
              <li><a href="/">Quy chế hoạt động</a></li>
              <li><a href="/">Giải quyết khiếu nại</a></li>
              <li><a href="/">Chính sách bảo mật</a></li>
            </ul>
          </Col>

          {/* Kết Nối Với Chúng Tôi */}
          <Col lg={6} md={12} className="mb-4">
            <h5 className="footer-title">KẾT NỐI VỚI CHÚNG TÔI</h5>
            
            {/* Contact Info */}
            <div className="contact-info mb-3">
              <div className="contact-item">
                <FontAwesomeIcon icon={faPhone} className="contact-icon" />
                <span>037.285.8098</span>
              </div>
              
             
              <div className="contact-item">
                <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                <span>info@tromoi.com</span>
              </div>
            </div>

            {/* Addresses */}
            <div>
              <div className="address-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
                <span>Văn Phòng : Phú Hữu,Tân Xã,Thạch Thất,Hà Nội</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="social-media">
              <a href="https://facebook.com/trosinhvienhola" target="_blank" rel="noopener noreferrer" className="social-link">
                <FontAwesomeIcon icon={faFacebook} /> trohola
              </a>
             
              <a href="https://tiktok.com/@tromoi.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <FontAwesomeIcon icon={faTiktok} /> @trohola.com
              </a>
              
              <a href="https://youtube.com/@tromoi" target="_blank" rel="noopener noreferrer" className="social-link">
                <FontAwesomeIcon icon={faYoutube} /> @trohola
              </a>
            </div>
          </Col>
        </Row>

        {/* Đơn Vị Đồng Hành */}
        <Row className="partners-section">
          <Col xs={12}>
            <p className="partners-text">Đơn vị đồng hành cùng <strong>trohola.vn</strong></p>
            <div className="partners-logos">
              <div className="partner-item">
                <img src="/images/logo/YoungHouse.png" alt="YoungHouse" />
              </div>
              <div className="partner-item">
                <img src="/images/logo/skyhome.png" alt="SkyHome" />
              </div>
              
            </div>
          </Col>
        </Row>

        {/* Copyright */}
        <Row className="footer-bottom">
          <Col md={6}>
            <p className="copyright">
              © 2025 Trọ HoLa
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <button className="scroll-top-btn" onClick={scrollToTop}>
              <FontAwesomeIcon icon={faArrowUp} />
              <span className="ms-2">Lên đầu trang</span>
            </button>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
