import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useLocation, useParams } from 'react-router-dom';
// import { Phone, MapPin, Home, Users, Wifi } from 'lucide-react';
// Thay thế lucide-react bằng Bootstrap icons hoặc FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone, 
  faMapMarkerAlt, 
  faHome, 
  faUsers, 
  faWifi,
  faSnowflake,
  faBath,
  faTshirt,
  faIceCream,
  faArrowLeft,
  faHeart,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import './RoomDetailPage.css';
import supabase from '../config/supabaseClient';

const RoomDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const hydratedRoom = location.state?.room || null;
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, dx: 0, dy: 0, startTime: 0 });

  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        setLoading(true);
        // 1) Use hydrated data from list if available
        let baseRoom = hydratedRoom;
        let roomErr = null;
        if (!baseRoom) {
          const resp = await supabase.from('rooms').select('*').eq('id', id).maybeSingle();
          baseRoom = resp.data;
          roomErr = resp.error;
        }
        if (roomErr) throw roomErr;
        if (!baseRoom) {
          setRoom(null);
          return;
        }
        const normalized = { ...baseRoom, images: [], amenities: [], targets: [], surroundings: [] };

        // 2) Try fetch optional relations independently; ignore errors if tables/policies not ready
        try {
          const { data: imgs } = await supabase.from('room_images').select('image_url, room_id').eq('room_id', id);
          if (Array.isArray(imgs)) normalized.images = imgs.map(x => ({ url: x.image_url })).filter(x => x.url);
        } catch (_) {}
        try {
          const { data: ams } = await supabase.from('room_amenities').select('amenities(name)').eq('room_id', id);
          if (Array.isArray(ams)) normalized.amenities = ams.map(x => ({ name: x?.amenities?.name })).filter(x => x.name);
        } catch (_) {}
        try {
          const { data: tgs } = await supabase.from('room_targets').select('targets(name)').eq('room_id', id);
          if (Array.isArray(tgs)) normalized.targets = tgs.map(x => ({ name: x?.targets?.name })).filter(x => x.name);
        } catch (_) {}
        try {
          const { data: surs } = await supabase.from('room_surroundings').select('surroundings(name)').eq('room_id', id);
          if (Array.isArray(surs)) normalized.surroundings = surs.map(x => ({ name: x?.surroundings?.name })).filter(x => x.name);
        } catch (_) {}

        setRoom(normalized);
      } catch (err) {
        setError(err.message || 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRoomDetail();
  }, [id]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const owner = {}; 
  const amenities = Array.isArray(room?.amenities) ? room.amenities.map(a => a.name) : [];
  const targets = Array.isArray(room?.targets) ? room.targets.map(t => t.name) : [];
  const surroundings = Array.isArray(room?.surroundings) ? room.surroundings.map(s => s.name) : [];
  


  const mainImage = room?.banner || '/images/rooms/room.jpg';
  const displayImages = [
    mainImage,
    ...((Array.isArray(room?.images) ? room.images.map(img => img.url) : []).filter(url => url && url !== mainImage))
  ];

  const clampIndex = (idx, length) => {
    if (length <= 0) return 0;
    const r = ((idx % length) + length) % length;
    return r;
  };

  const goPrev = () => {
    setCurrentImgIndex(prev => clampIndex(prev - 1, displayImages.length));
  };

  const goNext = () => {
    setCurrentImgIndex(prev => clampIndex(prev + 1, displayImages.length));
  };

  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragState({ isDragging: true, startX: clientX, startY: clientY, dx: 0, dy: 0, startTime: Date.now() });
  };

  const handlePointerMove = (e) => {
    if (!dragState.isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;
    setDragState(prev => ({ ...prev, dx, dy }));
  };

  const handlePointerUp = () => {
    if (!dragState.isDragging) return;
    const threshold = 5; // very light swipe
    const { dx } = dragState;
    let nextIndex = currentImgIndex;
    if (dx <= -threshold) {
      nextIndex = clampIndex(currentImgIndex + 1, displayImages.length);
    } else if (dx >= threshold) {
      nextIndex = clampIndex(currentImgIndex - 1, displayImages.length);
    }
    setCurrentImgIndex(nextIndex);
    setDragState({ isDragging: false, startX: 0, startY: 0, dx: 0, dy: 0, startTime: 0 });
  };

  // Function để lấy icon cho từng tiện nghi
  const getAmenityIcon = (amenityName) => {
    const iconMap = {
      'Wifi': faWifi,
      'Tủ lạnh': faIceCream,
      'Máy giặt': faTshirt,
      'Phòng tắm riêng': faBath,
      'Điều hòa': faSnowflake
    };
    return iconMap[amenityName] || faHome;
  };

  // Format description: sanitize HTML (allow <b>, <br>) and insert <br> after periods
  const formattedDescriptionHTML = useMemo(() => {
    if (!room || !room.description) return '';
    let html = String(room.description);
    // Keep only <b> and <br> tags, strip others
    html = html.replace(/<(?!\/?b\b|br\b)[^>]*>/gi, '');
    // Normalize <br> variations
    html = html.replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
    // Insert line breaks after periods (keep colons intact). Avoid duplicating if already followed by a line break
    html = html.replace(/\.\s*(?!\n|<br\s*\/?|$)/g, '.\n');
    // Convert newlines back to <br>
    html = html.replace(/\n/g, '<br />');
    return html;
  }, [room]);

  if (loading) {
    return (
      <div className="room-detail-page-container">
        <Container className="py-4 room-detail">
          <Row>
            <Col>
              <div className="text-center text-muted py-5">
                <div className="spinner-border me-2" role="status" /> Đang tải...
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-detail-page-container">
        <Container className="py-4 room-detail">
          <Row>
            <Col>
              <div className="alert alert-warning">Không tìm thấy phòng.</div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="room-detail-page-container">
      <Container className="py-4 room-detail">
      {error && (
        <Row className="mb-3">
          <Col>
            <div className="alert alert-danger py-2">{error}</div>
          </Col>
        </Row>
      )}
      {/* Header với breadcrumb và nút quay lại */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center">
           
            <nav aria-label="breadcrumb" className="flex-grow-1">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><a href="/rooms">Nhà trọ, phòng trọ</a></li>
                <li className="breadcrumb-item active" aria-current="page">{loading ? 'Đang tải...' : (room ? room.title : 'Không tìm thấy phòng')}</li>
              </ol>
            </nav>
          </div>
        </Col>
      </Row>
      <Row>
        <Col className='mb-3'>
          <Button variant="outline-secondary" size="sm" className="me-3 back-to-rooms-btn" onClick={() => window.history.back()}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Quay lại
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Phần header và ảnh gộp chung viền */}
          <Card className="mb-4 shadow-sm room-header-image-card">
            {/* Tiêu đề và địa chỉ */}
            <div className="room-header-info">
              <div className="d-flex justify-content-between align-items-start">
                <div className="room-header-content">
                  <h1 className="room-header-title">{room ? room.title : 'Không tìm thấy phòng'}</h1>
                  <div className="room-header-address">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" style={{ color: 'var(--secondary-color)' }} />
                    {room ? room.address : '-'}
                  </div>
                </div>
                <div className="room-header-actions">
                  {room && !loading && (
                    <Badge bg={room.status === 'available' ? 'success' : 'danger'} className="status-badge">
                      {room.status === 'available' ? 'Còn trống' : 'Đã đặt'}
                    </Badge>
                  )}
                  <Button variant="outline-secondary" size="sm" className="action-btn favorite-btn">
                    <FontAwesomeIcon icon={faHeart} />
                  </Button>
                  <Button variant="outline-secondary" size="sm" className="action-btn feedback-btn">
                    <FontAwesomeIcon icon={faComment} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hình ảnh: swipeable stacked gallery */}
            <div className="image-gallery">
              <div 
                className="stacked-gallery"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                {/* Nav buttons (desktop) */}
                <button
                  type="button"
                  className="stacked-nav left"
                  aria-label="Ảnh trước"
                  onClick={goPrev}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="stacked-nav right"
                  aria-label="Ảnh tiếp theo"
                  onClick={goNext}
                >
                  ›
                </button>
                {displayImages.slice(0, 3).map((src, i) => {
                  const idx = clampIndex(currentImgIndex + i, displayImages.length);
                  const isTop = i === 0;
                  const translateX = isTop ? dragState.dx : 0;
                  const translateY = isTop ? dragState.dy : i * 8;
                  const rotate = isTop ? dragState.dx * 0.05 : 0;
                  const scale = 1 - i * 0.04;
                  return (
                    <img
                      key={`${idx}-${src}`}
                      src={displayImages[idx]}
                      alt={`Hình ${idx + 1}`}
                      className={`stacked-image ${isTop ? 'top' : 'behind'}`}
                      style={{
                        transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                        zIndex: 10 - i,
                        opacity: 1 - i * 0.05
                      }}
                    />
                  );
                })}
                {displayImages.length === 0 && (
                  <div className="stacked-fallback" />
                )}
              </div>
              <div className="stacked-indicator">
                {displayImages.map((_, i) => (
                  <span key={i} className={`dot ${clampIndex(currentImgIndex, displayImages.length) === i ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </Card>

          {/* Phần liên hệ cho desktop - ngay dưới ảnh */}
          <Card className="mb-4 shadow-sm desktop-contact-card">
            <Card.Body>
              <h4 className="booking-title">Liên hệ tư vấn </h4>
              
              {/* Mô tả */}
              <p className="booking-description mb-3">
                {room && room.status === 'available' 
                  ? 'Phòng này đang còn trống và sẵn sàng cho thuê.' 
                  : 'Phòng hiện đã có người thuê.'
                }
              </p>

              {/* Giá tiền và 2 nút liên hệ trên cùng một hàng */}
              <div className="price-buttons-row">
                <div className="price-highlight">
                  <span className="price-number">{room ? Number(room.price).toLocaleString('vi-VN') : 0} ₫</span>
                  <span className="price-period">/tháng</span>
                </div>
                
                <div className="buttons-group">
                  <Button 
                    variant="success" 
                    size="lg" 
                    className="booking-btn"
                    disabled={!room || room.status !== 'available'}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <FontAwesomeIcon icon={faPhone} size="sm" className="me-2" style={{ color: 'white' }} />
                    Liên hệ 
                  </Button>



                  <Button 
                    as="a" 
                    href="https://zalo.me/0372858098"
                    variant="outline-primary" 
                    className="call-btn zalo-btn-desktop"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <img src="/images/logo/zalo.png" alt="Zalo" className="zalo-icon-desktop me-2" />
                    Zalo
                  </Button>
                </div>
              </div>

              <div className="safety-note mt-3">
                <small className="text-muted">
                  💡 Lưu ý: Hãy kiểm tra kỹ thông tin và xem trực tiếp phòng trước khi đặt cọc.
                </small>
              </div>
            </Card.Body>
          </Card>

          {/* Thông tin chi tiết */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
             

              {/* Mô tả */}
              <div className="info-section mb-4">
                <h5 className="section-title">Giới thiệu</h5>
                <div className="price-section mb-4">
                <div className="room-specs">
                  <span className="spec-item">
                    <FontAwesomeIcon icon={faHome} size="sm" className="me-1" style={{ color: 'var(--secondary-color)' }} />
                    Khoảng {room ? room.area : 0}m²
                  </span>
                  <span className="spec-item">
                    <FontAwesomeIcon icon={faUsers} size="sm" className="me-1" style={{ color: 'var(--secondary-color)' }} />
                    Ngày đăng: 18-08-2025
                  </span>
                </div>
              </div>
                <p>
                  <strong>Mô tả:</strong>{' '}
                  {formattedDescriptionHTML
                    ? <span dangerouslySetInnerHTML={{ __html: formattedDescriptionHTML }} />
                    : 'Phòng trọ chất lượng, tiện nghi đầy đủ, vị trí thuận lợi cho việc đi lại và sinh hoạt.'}
                </p>
                <p><strong>Tổng quan:</strong> Phòng được thiết kế hiện đại, thoáng mát, phù hợp cho sinh viên và người đi làm.</p>
                {room && (
                  <div className="room-stats mt-3">
                    
                   
                  </div>
                )}
              </div>

              {/* Đối tượng */}
              {targets.length > 0 && (
                <div className="info-section mb-4">
                  <h5 className="section-title">Đối tượng</h5>
                  <div className="tags-container">
                    {targets.map((target, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-2 mb-2 tag-badge">
                        {target}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tiện nghi */}
              {amenities.length > 0 && (
                <div className="info-section mb-4">
                  <h5 className="section-title">Tiện nghi</h5>
                  <div className="amenities-grid">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="amenity-item">
                        <FontAwesomeIcon 
                          icon={getAmenityIcon(amenity)} 
                          className="amenity-icon me-2" 
                          style={{ color: 'var(--secondary-color)', fontSize: '16px' }}
                        />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Môi trường xung quanh */}
              <div className="info-section mb-4">
                <h5 className="section-title">Môi trường xung quanh</h5>
                <div className="tags-container">
                  {surroundings.length > 0 ? (
                    surroundings.map((surrounding, index) => (
                      <Badge 
                        key={index} 
                        bg="light" 
                        text="dark" 
                        className="me-2 mb-2 tag-badge border"
                        style={{ borderColor: 'var(--primary-color)' }}
                      >
                        {surrounding}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted">Đang cập nhật thông tin môi trường xung quanh...</p>
                  )}
                </div>
              </div>

              {/* Thông tin liên hệ */}
              
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar đặt phòng */}
        <Col lg={4}>
          <Card className="booking-card sticky-top shadow-sm">
            <Card.Body>
              <h4 className="booking-title">Liên hệ chủ trọ</h4>
              <div className="price-highlight mb-3">
                <span className="price-number">{room ? room.price.toLocaleString('vi-VN') : 0} ₫</span>
                <span className="price-period">/tháng</span>
              </div>
              
              <p className="booking-description">
                {room && room.status === 'available' 
                  ? 'Phòng này đang còn trống và sẵn sàng cho thuê.' 
                  : 'Phòng hiện đã được đặt.'
                }
              </p>

              <div className="booking-actions">
                <Button 
                  variant="success" 
                  size="lg" 
                  className="w-100 mb-3 booking-btn"
                  disabled={!room || room.status !== 'available'}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <FontAwesomeIcon icon={faPhone} size="sm" className="me-2" style={{ color: 'white' }} />
                  Liên hệ chủ trọ
                </Button>

                {owner && owner.phone && (
                  <Button 
                    as="a" 
                    href={`tel:${owner.phone}`} 
                    variant="outline-primary" 
                    className="w-100 call-btn"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <FontAwesomeIcon icon={faPhone} size="sm" className="me-2" style={{ color: 'var(--secondary-color)' }} />
                    Gọi ngay: {owner.phone}
                  </Button>
                )}
              </div>

              <div className="safety-note mt-3">
                <small className="text-muted">
                  💡 Lưu ý: Hãy kiểm tra kỹ thông tin và xem trực tiếp phòng trước khi đặt cọc.
                </small>
              </div>
            </Card.Body>
          </Card>

          {/* Bản đồ */}
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Đường đi</h5>
              <div className="map-placeholder">
                <p className="text-muted py-4">
                  <FontAwesomeIcon icon={faMapMarkerAlt} size="lg" className="mb-2" style={{ color: 'var(--secondary-color)' }} />
                  <br />
                  Bản đồ vị trí
                  <br />
                  <small>{room ? room.address : 'Phan Huy Ích, Phường 14, Quận Gò Vấp'}</small>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </Container>

      {/* Mobile Bottom Bar - Above Bottom Navigation */}
      <div className="mobile-bottom-bar">
        <div className="mobile-bottom-content">
          <div className="mobile-price-section">
            <div className="mobile-price">
              {room ? room.price.toLocaleString('vi-VN') : 0} ₫
            </div>
            <div className="mobile-price-period">/tháng</div>
          </div>
          <div className="mobile-contact-section">
            <a 
              href="tel:0372858098"
              className="mobile-contact-btn mobile-primary-btn"
              style={{ textDecoration: 'none' }}
            >
              <FontAwesomeIcon icon={faPhone} size="sm" />
              
            </a>
            <a 
              href="https://zalo.me/0372858098"
              className="mobile-contact-btn mobile-zalo-btn"
              style={{ textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/images/logo/zalo.png" alt="Zalo" className="zalo-icon" />
              Zalo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
