import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Dropdown, InputGroup, Collapse, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faEye, faHeart, faChevronDown, faSearch, faHome, faDollarSign, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import './RoomsPage.css';
import supabase from '../config/supabaseClient';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true); // first load
  const [isFetching, setIsFetching] = useState(false); // page transitions
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('Mới nhất');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Nhà trọ, phòng trọ');
  const [selectedPriceRange, setSelectedPriceRange] = useState('Mức giá');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Debounce search input (must be declared before effects that depend on it)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchKeyword.trim()), 250);
    return () => clearTimeout(t);
  }, [searchKeyword]);

  useEffect(() => {
    const fetchRooms = async (targetPage) => {
      try {
        setIsFetching(true);
        if (rooms.length === 0) setLoading(true);
        const from = (targetPage - 1) * pageSize;
        const to = from + pageSize - 1;
        let orderBy = { column: 'created_at', ascending: false };
        if (sortBy === 'Giá thấp đến cao') orderBy = { column: 'price', ascending: true };
        if (sortBy === 'Giá cao đến thấp') orderBy = { column: 'price', ascending: false };
        let query = supabase
          .from('rooms')
          .select('id, title, address, price, status, area, banner', { count: 'exact' });

        // Server-side search by title/address
        const q = debouncedSearch.trim();
        if (q) {
          const pattern = `%${q}%`;
          query = query.or(`title.ilike.${pattern},address.ilike.${pattern}`);
        }

        // Server-side price range
        switch (selectedPriceRange) {
          case 'Dưới 2 triệu':
            query = query.lt('price', 2000000);
            break;
          case '2 - 5 triệu':
            query = query.gte('price', 2000000).lte('price', 5000000);
            break;
          case '5 - 10 triệu':
            query = query.gte('price', 5000000).lte('price', 10000000);
            break;
          case 'Trên 10 triệu':
            query = query.gt('price', 10000000);
            break;
          default:
            break;
        }

        const { data, error, count } = await query
          .order(orderBy.column, { ascending: orderBy.ascending })
          .range(from, to);
        if (error) throw error;
        setRooms(Array.isArray(data) ? data : []);
        const total = count || 0;
        setPagination({ page: targetPage, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
      } catch (err) {
        setError(err.message || 'Lỗi không xác định');
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    };
    fetchRooms(page);
  }, [page, pageSize, sortBy, debouncedSearch, selectedPriceRange]);

  const handleChangePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  // Handle card click to navigate to room detail
  const handleCardClick = (roomData, event) => {
    // Prevent navigation if clicking on interactive elements
    if (event.target.closest('a, button')) {
      return;
    }
    navigate(`/room/${roomData.id}`, { state: { room: roomData } });
  };


  // Data đã filter server-side
  const filteredRooms = rooms;

  // Reset về trang 1 khi filter/sort/search thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedPriceRange, sortBy]);
  
  return (  
    <div className="rooms-page-container">
      <Container fluid className="px-0 px-md-0">
      {/* Breadcrumb */}
      <Row className="py-2 py-md-3">
        <Col>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none">Trang chủ</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                <span className="d-none d-sm-inline">Nhà trọ, phòng trọ</span>
                <span className="d-sm-none">Nhà trọ</span>
              </li>
            </ol>
          </nav>
        </Col>
      </Row>
      
      {/* Search Bar */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm" style={{ 
            background: 'linear-gradient(135deg, #c6824b 0%, #374151 100%)' 
          }}>
            <Card.Body className="py-3 search-form">
              <Row className="g-2 align-items-center">
                <Col xs={12} lg={5} className="mb-2 mb-lg-0">
                  <InputGroup>
                    <InputGroup.Text className="bg-white border-end-0">
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Bạn muốn tìm trọ ở đâu?"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="border-start-0"
                      style={{ boxShadow: 'none' }}
                    />
                  </InputGroup>
                </Col>
                <Col xs={6} lg={3} className="mb-2 mb-lg-0">
                  <Dropdown className="w-100">
                    <Dropdown.Toggle 
                      variant="white" 
                      className="w-100 text-start d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}
                    >
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faHome} className="text-muted me-2 d-none d-md-inline" />
                        <span className="text-truncate">{selectedLocation}</span>
                      </div>
                      
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      <Dropdown.Item onClick={() => setSelectedLocation('Nhà trọ, phòng trọ')}>
                        Nhà trọ, phòng trọ
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setSelectedLocation('Nhà nguyên căn')}>
                        Nhà nguyên căn
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setSelectedLocation('Căn hộ')}>
                        Căn hộ
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
                <Col xs={6} lg={2} className="mb-2 mb-lg-0">
                  <Dropdown className="w-100">
                    <Dropdown.Toggle 
                      variant="white" 
                      className="w-100 text-start d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}
                    >
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faDollarSign} className="text-muted me-2 d-none d-md-inline" />
                        <span className="text-truncate">{selectedPriceRange}</span>
                      </div>
                      
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      <Dropdown.Item onClick={() => setSelectedPriceRange('Mức giá')}>
                        Mức giá
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setSelectedPriceRange('Dưới 2 triệu')}>
                        Dưới 2 triệu
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setSelectedPriceRange('2 - 5 triệu')}>
                        2 - 5 triệu
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setSelectedPriceRange('5 - 10 triệu')}>
                        5 - 10 triệu
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setSelectedPriceRange('Trên 10 triệu')}>
                        Trên 10 triệu
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
                <Col xs={12} lg={2}>
                  <Button 
                    variant="warning" 
                    className="w-100 fw-bold text-white search-button"
                    style={{ 
                      backgroundColor: '#c6824b', 
                      border: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#b87333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#c6824b'}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <FontAwesomeIcon icon={faSearch} className="me-2" />
                    <span className="d-none d-sm-inline">Tìm kiếm</span>
                    <span className="d-sm-none">Tìm</span>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="h3 mb-0 text-uppercase fw-bold text-dark d-none d-md-block">
            CHO THUÊ NHÀ TRỌ, PHÒNG TRỌ GIÁ RẺ, MỚI NHẤT
          </h1>
          <h2 className="h5 mb-0 text-uppercase fw-bold text-dark d-md-none">
            NHÀ TRỌ, PHÒNG TRỌ
          </h2>
        </Col>
      </Row>
      
      <Row>
        {/* Main Content */}
        <Col lg={9}>
          {/* Results header */}
          <Row className="align-items-center mb-3">
            <Col xs={12} md={6} className="mb-2 mb-md-0">
              <span className="text-muted">
                Tổng <strong>{pagination.total || filteredRooms.length}</strong> kết quả
              </span>
            </Col>
            <Col xs={12} md={6}>
              <div className="d-flex align-items-center justify-content-between justify-content-md-end">
                {/* Mobile Filter Button */}
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="d-lg-none me-2"
                  onClick={() => setShowMobileFilter(true)}
                >
                  <FontAwesomeIcon icon={faFilter} className="me-1" />
                  Bộ lọc
                </Button>
                
                <div className="d-flex align-items-center">
                  <span className="me-2 text-muted d-none d-sm-inline">Sắp xếp theo</span>
                  <span className="me-2 text-muted d-sm-none">Sắp xếp:</span>
                  <Dropdown>
                    <Dropdown.Toggle 
                      variant="outline-secondary" 
                      size="sm" 
                      className="border-0 text-primary"
                    >
                      
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setSortBy('Mới nhất')}>Mới nhất</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSortBy('Giá thấp đến cao')}>Giá thấp đến cao</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSortBy('Giá cao đến thấp')}>Giá cao đến thấp</Dropdown.Item>
                      <Dropdown.Item onClick={() => setSortBy('Diện tích')}>Diện tích</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </Col>
          </Row>

          {/* Pagination Controls moved to bottom */}

          {/* Mobile Filter Modal */}
          <Modal 
            show={showMobileFilter} 
            onHide={() => setShowMobileFilter(false)}
            centered
            className="mobile-filter-modal"
          >
            <Modal.Header className="border-0 pb-0">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                <Modal.Title className="h5 mb-0">Lọc tìm kiếm</Modal.Title>
              </div>
              <Button 
                variant="link" 
                className="btn-close-custom p-0"
                onClick={() => setShowMobileFilter(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </Modal.Header>
            <Modal.Body className="pt-2">
              {/* Diện tích */}
              <div className="filter-section mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-3">Diện tích</h6>
                  <FontAwesomeIcon icon={faChevronDown} className="text-muted" />
                </div>
                <div className="filter-options">
                  <Form.Check 
                    type="radio"
                    label="Dưới 20 m²"
                    name="area-mobile"
                    id="area-under-20-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="20-40 m²"
                    name="area-mobile"
                    id="area-20-40-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="40-60 m²"
                    name="area-mobile"
                    id="area-40-60-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="60-80 m²"
                    name="area-mobile"
                    id="area-60-80-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="Trên 80 m²"
                    name="area-mobile"
                    id="area-over-80-mobile"
                    className="mb-2"
                  />
                </div>
              </div>

              {/* Tiện nghi */}
              <div className="filter-section mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-3">Tiện nghi</h6>
                  <FontAwesomeIcon icon={faChevronDown} className="text-muted" />
                </div>
                <div className="filter-options">
                  <Form.Check 
                    type="checkbox"
                    label="Gác lửng"
                    id="amenity-loft-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Wifi"
                    id="amenity-wifi-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Vệ sinh trong"
                    id="amenity-private-toilet-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Phòng tắm"
                    id="amenity-bathroom-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Bình nóng lạnh"
                    id="amenity-water-heater-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Kệ bếp"
                    id="amenity-kitchen-mobile"
                    className="mb-2"
                  />
                </div>
                <Button variant="link" className="p-0 text-primary small mt-1">
                  Hiển thị thêm
                </Button>
              </div>

              {/* Môi trường xung quanh */}
              <div className="filter-section mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-3">Môi trường xung quanh</h6>
                  <FontAwesomeIcon icon={faChevronDown} className="text-muted" />
                </div>
                <div className="filter-options">
                  <Form.Check 
                    type="checkbox"
                    label="Chợ"
                    id="surrounding-market-mobile"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Siêu thị"
                    id="surrounding-supermarket-mobile"
                    className="mb-2"
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <div className="d-flex gap-2 w-100">
                <Button 
                  variant="primary" 
                  className="flex-fill fw-bold"
                  style={{ backgroundColor: '#1e40af', borderColor: '#1e40af' }}
                  onClick={() => { setShowMobileFilter(false); window.scrollTo(0, 0); }}
                >
                  Tìm ngay
                </Button>
                <Button 
                  variant="outline-secondary" 
                  className="flex-fill"
                  onClick={() => { setShowMobileFilter(false); window.scrollTo(0, 0); }}
                >
                  Xoá bộ lọc
                </Button>
              </div>
            </Modal.Footer>
          </Modal>

          {/* Room List */}
          <Row>
            {loading && rooms.length === 0 && (
              <>
                {Array.from({ length: pageSize }).map((_, i) => (
                  <Col xs={12} className="mb-3" key={`skeleton-${i}`}>
                    <Card className="shadow-sm border-0 room-card" style={{ opacity: 0.85 }}>
                      <Row className="g-0">
                        <Col xs={12} md={4} lg={3}>
                          <div className="w-100 h-100" style={{ height: '200px', background: '#f1f1f1' }} />
                        </Col>
                        <Col xs={12} md={8} lg={9}>
                          <Card.Body className="p-3">
                            <div className="mb-2" style={{ height: 20, width: '60%', background: '#f1f1f1', borderRadius: 6 }} />
                            <div className="mb-2" style={{ height: 16, width: '40%', background: '#f5f5f5', borderRadius: 6 }} />
                            <div className="mb-2" style={{ height: 16, width: '30%', background: '#f7f7f7', borderRadius: 6 }} />
                            <div className="d-flex justify-content-between align-items-center" style={{ marginTop: 12 }}>
                              <div style={{ height: 16, width: 80, background: '#f1f1f1', borderRadius: 6 }} />
                              <div style={{ height: 20, width: 100, background: '#eee', borderRadius: 10 }} />
                            </div>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </>
            )}
            {error && (
              <Col xs={12} className="mb-3">
                <div className="text-center text-danger">{error}</div>
              </Col>
            )}
            {!loading && !error && rooms.length === 0 && (
              <Col xs={12} className="mb-3">
                <div className="text-center text-muted">Không có phòng nào</div>
              </Col>
            )}
            {!error && filteredRooms.map((room, index) => {
              // Sử dụng ảnh local thay vì ảnh từ database
              const imageUrl = room.banner || '/images/rooms/room.jpg';
              const isHot = index < 2; // First 2 rooms are "HOT"
              
              return (
                <Col xs={12} className="mb-3" key={room.id}>
                  <Card 
                    className="shadow-sm border-0 room-card"
                    onClick={(e) => handleCardClick(room, e)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Row className="g-0">
                      <Col xs={12} md={4} lg={3}>
                        <div className="position-relative">
                          <img 
                            src={imageUrl} 
                            alt={room.title}
                            className="img-fluid rounded-start h-100 w-100"
                            loading="lazy"
                            style={{ 
                              height: '200px', 
                              objectFit: 'cover',
                              minHeight: '180px'
                            }}
                          />
                          {isFetching && (
                            <div className="position-absolute top-0 start-0 w-100 h-100" style={{background:'rgba(255,255,255,0.4)'}} />
                          )}
                          {isHot && (
                            <Badge 
                              bg="danger" 
                              className="position-absolute top-0 start-0 m-2 px-2 py-1"
                              style={{ fontSize: '10px', fontWeight: 'bold' }}
                            >
                              HOT
                            </Badge>
                          )}
                          <div className="position-absolute bottom-0 start-0 m-2">
                            <Badge bg="primary" className="me-1">
                              <FontAwesomeIcon icon={faEye} className="me-1" />
                              Review
                            </Badge>
                          </div>
                          <Button 
                            variant="link" 
                            className="position-absolute top-0 end-0 m-2 p-1 text-white"
                            style={{ fontSize: '18px' }}
                          >
                            <FontAwesomeIcon icon={faHeart} />
                          </Button>
                        </div>
                      </Col>
                      <Col xs={12} md={8} lg={9}>
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="card-title mb-1 text-dark fw-bold">
                              <Link 
                                to={`/room/${room.id}`} 
                                className="text-decoration-none text-dark"
                              >
                                {room.title}
                              </Link>
                            </h5>
                          </div>
                          
                          <div className="mb-2">
                            <span className="fw-bold h5 mb-0" style={{ color: 'var(--secondary-color)' }}>
                              Từ {(Number(room.price) / 1000000).toFixed(1)} triệu/tháng
                            </span>
                          </div>

                          <div className="mb-2">
                            <span className="badge bg-light text-dark me-2 border">
                              Nhà trọ, phòng trọ
                            </span>
                            <span className="badge bg-light text-dark border">
                              {room.area}m²
                            </span>
                          </div>

                          <div className="mb-2">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted me-1" />
                            <span className="text-muted small">{room.address}</span>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Chủ trọ</span>
                            <span className={`badge ${room.status === 'available' ? 'bg-success' : 'bg-secondary'}`}>
                              {room.status === 'available' ? 'Còn trống' : 'Đã thuê'}
                            </span>
                          </div>
                        </Card.Body>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Col>

        {/* Sidebar */}
        <Col lg={3} className="d-none d-lg-block">
          <div className="position-sticky sidebar-filter" style={{ top: '20px' }}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-primary text-white border-0">
                <FontAwesomeIcon icon={faChevronDown} className="me-2" />
                <strong>Lọc tìm kiếm</strong>
              </Card.Header>
              <Card.Body>
                {/* Diện tích */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Diện tích</h6>
                  <Form.Check 
                    type="radio"
                    label="Dưới 20 m²"
                    name="area"
                    id="area-under-20"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="20-40 m²"
                    name="area"
                    id="area-20-40"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="40-60 m²"
                    name="area"
                    id="area-40-60"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="60-80 m²"
                    name="area"
                    id="area-60-80"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="radio"
                    label="Trên 80 m²"
                    name="area"
                    id="area-over-80"
                    className="mb-2"
                  />
                </div>

                {/* Tiện nghi */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Tiện nghi</h6>
                  <Form.Check 
                    type="checkbox"
                    label="Gác lửng"
                    id="amenity-loft"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Wifi"
                    id="amenity-wifi"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Vệ sinh trong"
                    id="amenity-private-toilet"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Phòng tắm"
                    id="amenity-bathroom"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Bình nóng lạnh"
                    id="amenity-water-heater"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Kệ bếp"
                    id="amenity-kitchen"
                    className="mb-2"
                  />
                  <Button variant="link" className="p-0 text-primary small">
                    Hiển thị thêm
                  </Button>
                </div>

                {/* Môi trường xung quanh */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Môi trường xung quanh</h6>
                  <Form.Check 
                    type="checkbox"
                    label="Chợ"
                    id="surrounding-market"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Siêu thị"
                    id="surrounding-supermarket"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Bệnh viện"
                    id="surrounding-hospital"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Trường học"
                    id="surrounding-school"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Công viên"
                    id="surrounding-park"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Bến xe bus"
                    id="surrounding-bus-stop"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Trung tâm thể dục thể thao"
                    id="surrounding-gym"
                    className="mb-2"
                  />
                </div>

                {/* Đối tượng */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Đối tượng</h6>
                  <Form.Check 
                    type="checkbox"
                    label="Đi học"
                    id="target-student"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Đi làm"
                    id="target-worker"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Gia đình"
                    id="target-family"
                    className="mb-2"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Cặp đôi"
                    id="target-couple"
                    className="mb-2"
                  />
                </div>

                {/* Video Review */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Video Review</h6>
                  <Form.Check 
                    type="checkbox"
                    label="Có video review"
                    id="has-video-review"
                    className="mb-2"
                  />
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <Button variant="primary" size="md" className="flex-fill" onClick={() => window.scrollTo(0, 0)}>
                    Tìm ngay
                  </Button>
                  <Button variant="outline-secondary" size="md" className="flex-fill" onClick={() => window.scrollTo(0, 0)}>
                    Xoá bộ lọc
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
          </Col>
      </Row>
    </Container>
    {/* Bottom Pagination Controls */}
    {!loading && !error && (
      <div className="py-3">
        <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            disabled={page <= 1}
            onClick={() => handleChangePage(page - 1)}
          >
            Trang trước
          </Button>
          {(() => {
            const total = pagination.totalPages || 1;
            const start = Math.max(1, page - 2);
            const end = Math.min(total, page + 2);
            const btns = [];
            for (let p = start; p <= end; p++) {
              btns.push(
                <Button key={p} variant={p === page ? 'primary' : 'outline-secondary'} size="sm" onClick={() => handleChangePage(p)}>
                  {p}
                </Button>
              );
            }
            return btns;
          })()}
          <Button 
            variant="outline-secondary" 
            size="sm" 
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => handleChangePage(page + 1)}
          >
            Trang sau
          </Button>
        </div>
      </div>
    )}
    </div>
  );
};

export default RoomsPage;
