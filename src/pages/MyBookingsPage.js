import React from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const MyBookingsPage = () => {
  const bookings = [
    {
      id: 1,
      roomName: "Phòng trọ Quận 1",
      address: "123 Đường ABC, Quận 1",
      price: "2,500,000 VNĐ/tháng",
      status: "confirmed",
      bookingDate: "2024-01-15",
      moveInDate: "2024-02-01"
    },
    {
      id: 2,
      roomName: "Phòng trọ Quận 2",
      address: "456 Đường XYZ, Quận 2",
      price: "2,000,000 VNĐ/tháng",
      status: "pending",
      bookingDate: "2024-01-20",
      moveInDate: "2024-02-15"
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Badge bg="success">Đã xác nhận</Badge>;
      case 'pending':
        return <Badge bg="warning">Chờ xác nhận</Badge>;
      case 'canceled':
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h1 className="mb-4">Đặt phòng của tôi</h1>
        </Col>
      </Row>
      
      <Row>
        {bookings.map((booking) => (
          <Col md={6} key={booking.id} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5>{booking.roomName}</h5>
                  {getStatusBadge(booking.status)}
                </div>
                
                <p><strong>Địa chỉ:</strong> {booking.address}</p>
                <p><strong>Giá:</strong> {booking.price}</p>
                <p><strong>Ngày đặt:</strong> {booking.bookingDate}</p>
                <p><strong>Ngày nhận phòng:</strong> {booking.moveInDate}</p>
                
                <div className="mt-3">
                  {booking.status === 'pending' && (
                    <Button variant="outline-danger" size="sm" className="me-2">
                      Hủy đặt phòng
                    </Button>
                  )}
                  <Button variant="outline-primary" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {bookings.length === 0 && (
        <Row>
          <Col className="text-center py-5">
            <h4>Bạn chưa có đặt phòng nào</h4>
            <p>Hãy tìm và đặt phòng trọ phù hợp với bạn!</p>
            <Button variant="primary" as={Link} to="/rooms">
              Tìm phòng ngay
            </Button>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default MyBookingsPage;
