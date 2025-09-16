import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../config/supabaseClient';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }
        setUser(currentUser);
        let r = currentUser.user_metadata?.role || '';
        if (!r) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).maybeSingle();
          r = profile?.role || '';
        }
        setRole(r || 'authenticated');
        if (r !== 'admin') {
          navigate('/user-home');
          return;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center text-muted py-5">
          <div className="spinner-border me-2" role="status" /> Đang tải...
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="h3">Bảng điều khiển Admin</h1>
          <div className="text-muted">Xin chào, {user?.email}</div>
        </Col>
      </Row>
      <Row className="g-3">
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Quản lý phòng</Card.Title>
              <Card.Text>Thêm/sửa/xóa phòng, quản lý ảnh.</Card.Text>
              <Button as={Link} to="/manage-rooms" variant="primary">Đi tới</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Đơn đặt phòng</Card.Title>
              <Card.Text>Theo dõi các đơn đặt phòng (đang phát triển).</Card.Text>
              <Button variant="outline-secondary" disabled>Đang phát triển</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Người dùng</Card.Title>
              <Card.Text>Quản lý tài khoản người dùng (đang phát triển).</Card.Text>
              <Button variant="outline-secondary" disabled>Đang phát triển</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;


