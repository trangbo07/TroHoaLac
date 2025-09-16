import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Spinner, Modal, Image } from 'react-bootstrap';
import AdminCreateRoomForm from '../components/AdminCreateRoomForm';
import supabase from '../config/supabaseClient';

const ManageRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    area: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    status: 'available',
    banner: ''
  });
  const [editImages, setEditImages] = useState([]); // [{id,url}]
  const [addingImages, setAddingImages] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importDetails, setImportDetails] = useState([]);
  const token = useMemo(() => localStorage.getItem('access_token') || '', []);

  const fetchRooms = async (p = 1) => {
    try {
      setRoomsLoading(true);
      const pageSize = 10;
      const from = (p - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('rooms')
        .select('id, title, address, price, status', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      setRooms(Array.isArray(data) ? data : []);
      const totalPagesCalc = Math.max(1, Math.ceil((count || 0) / pageSize));
      setPage(p);
      setTotalPages(totalPagesCalc);
    } catch (e) {
      alert(e.message || 'Lỗi tải danh sách phòng');
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleExcelChange = (e) => {
    const file = (e.target.files && e.target.files[0]) || null;
    setExcelFile(file);
  };

  const handleImportExcel = async () => {
    if (!excelFile) {
      setImportMsg('Vui lòng chọn file .csv theo mẫu');
      return;
    }
    try {
      setImporting(true);
      setImportMsg('');
      const text = await excelFile.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) throw new Error('File trống hoặc sai định dạng');
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const idx = (name) => header.indexOf(name);
      const rows = [];
      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length === 0 || cols.every(c => c.trim() === '')) continue;
        try {
          const row = {
            title: (cols[idx('title')] || '').trim(),
            description: (cols[idx('description')] || '').trim() || null,
            price: Number((cols[idx('price')] || '0').replace(/\D/g, '')) || 0,
            area: cols[idx('area')] ? Number(cols[idx('area')]) : null,
            address: (cols[idx('address')] || '').trim(),
            city: (cols[idx('city')] || '').trim() || null,
            district: (cols[idx('district')] || '').trim() || null,
            ward: (cols[idx('ward')] || '').trim() || null,
            status: (cols[idx('status')] || 'available').trim() || 'available',
            banner: (cols[idx('banner')] || '').trim() || null
          };
          if (!row.title || !row.address) {
            results.push({ index: i + 1, status: 'error', error: 'Thiếu title hoặc address' });
            continue;
          }
          rows.push(row);
          results.push({ index: i + 1, status: 'ok', title: row.title });
        } catch (e) {
          results.push({ index: i + 1, status: 'error', error: e.message });
        }
      }
      if (rows.length > 0) {
        const { error } = await supabase.from('rooms').insert(rows);
        if (error) throw error;
      }
      setImportMsg(`Import xong: Tổng ${results.length}, thành công ${results.filter(r=>r.status==='ok').length}, lỗi ${results.filter(r=>r.status==='error').length}`);
      setImportDetails(results);
      // refresh list
      fetchRooms(page);
    } catch (err) {
      setImportMsg(err.message || 'Lỗi import');
      setImportDetails([]);
    } finally {
      setImporting(false);
    }
  };

  const openEdit = async (roomId) => {
    try {
      setShowEdit(true);
      setEditingRoomId(roomId);
      setEditingLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();
      if (error) throw error;
      setEditForm({
        title: data?.title || '',
        description: data?.description || '',
        price: data?.price ?? '',
        area: data?.area ?? '',
        address: data?.address || '',
        city: data?.city || '',
        district: data?.district || '',
        ward: data?.ward || '',
        status: data?.status || 'available',
        banner: data?.banner || ''
      });
      // Fetch room images from DB
      try {
        const { data: imgs } = await supabase
          .from('room_images')
          .select('id, image_url')
          .eq('room_id', roomId);
        const mapped = Array.isArray(imgs)
          ? imgs.map((r) => ({ id: r.id, url: r.image_url, path: null }))
          : [];
        setEditImages(mapped);
      } catch (_) {
        setEditImages([]);
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message || 'Lỗi tải dữ liệu phòng');
      setShowEdit(false);
      setEditingRoomId(null);
    } finally {
      setEditingLoading(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingRoomId) return;
    try {
      setSavingEdit(true);
      const updateBody = {
        title: editForm.title,
        description: editForm.description || null,
        price: Number(editForm.price) || 0,
        area: editForm.area ? Number(editForm.area) : null,
        address: editForm.address,
        city: editForm.city || null,
        district: editForm.district || null,
        ward: editForm.ward || null,
        status: editForm.status || 'available',
        banner: editForm.banner || null
      };
      const { error } = await supabase
        .from('rooms')
        .update(updateBody)
        .eq('id', editingRoomId);
      if (error) throw error;
      // eslint-disable-next-line no-alert
      alert('Đã lưu thay đổi');
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message || 'Lỗi cập nhật');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUploadFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles(files);
  };

  // Simple client-side image compression (Canvas -> WebP)
  const compressWithCanvas = async (file, { maxDim = 1280, quality = 0.75, type = 'image/webp' } = {}) => {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
      if (!blob) return file;
      const newName = file.name.replace(/\.[^.]+$/, '.webp');
      return new File([blob], newName, { type });
    } catch (_) {
      return file;
    }
  };

  const handleUploadAndAddImages = async () => {
    if (!editingRoomId || uploadFiles.length === 0) return;
    try {
      setAddingImages(true);
      const bucket = process.env.REACT_APP_SB_ROOM_IMAGES_BUCKET || 'room-images';
      const uploaded = [];
      const dbRows = [];
      for (const file of uploadFiles) {
        const compressed = await compressWithCanvas(file, { maxDim: 1280, quality: 0.75, type: 'image/webp' });
        const path = `rooms/${editingRoomId}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, compressed, { upsert: true, cacheControl: '3600' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push({ id: path, url: pub.publicUrl, path });
        dbRows.push({ room_id: editingRoomId, image_url: pub.publicUrl });
      }
      // Insert DB rows and get IDs back
      if (dbRows.length > 0) {
        const ins = await supabase.from('room_images').insert(dbRows).select('id, image_url');
        if (!ins.error && Array.isArray(ins.data)) {
          // Merge DB ids into uploaded list by url
          uploaded.forEach((u) => {
            const found = ins.data.find((d) => d.image_url === u.url);
            if (found) u.id = found.id;
          });
        }
      }
      // Set first image as banner if empty
      if (!editForm.banner && uploaded[0]) {
        setEditForm(prev => ({ ...prev, banner: uploaded[0].url }));
        await supabase.from('rooms').update({ banner: uploaded[0].url }).eq('id', editingRoomId);
      }
      setEditImages(prev => [...prev, ...uploaded]);
      setUploadFiles([]);
      alert('Đã tải ảnh lên');
    } catch (e) {
      alert(e.message || 'Lỗi thêm ảnh');
    } finally {
      setAddingImages(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!editingRoomId || !imageId) return;
    try {
      const bucket = process.env.REACT_APP_SB_ROOM_IMAGES_BUCKET || 'room-images';
      const toDelete = editImages.find(img => img.id === imageId);
      if (toDelete?.path) {
        await supabase.storage.from(bucket).remove([toDelete.path]);
      }
      // Remove DB row if id is from DB
      if (typeof imageId === 'number') {
        await supabase.from('room_images').delete().eq('id', imageId);
      }
      setEditImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (e) {
      alert(e.message || 'Lỗi xóa ảnh');
    }
  };

  const handleSetBannerFromImage = (url) => {
    if (!url) return;
    setEditForm((prev) => ({ ...prev, banner: url }));
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Quản lý phòng trọ</h1>
            <div className="d-flex align-items-center gap-2">
              <a href="/templates/room_import_template.csv" className="btn btn-outline-secondary" download>
                Tải file mẫu
              </a>
              <Form.Control type="file" accept=".xlsx" onChange={handleExcelChange} style={{ maxWidth: 260 }} />
              <Button variant="primary" onClick={() => { handleImportExcel(); window.scrollTo(0, 0); }} disabled={importing}>
                {importing ? (<><Spinner size="sm" className="me-2" />Đang import...</>) : 'Import Excel'}
              </Button>
              <Button variant="success" onClick={() => { setShowCreate(true); window.scrollTo(0, 0); }}>
                Thêm phòng mới
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      {importMsg && (
        <Row className="mb-3">
          <Col>
            <div className="alert alert-info py-2">{importMsg}</div>
          </Col>
        </Row>
      )}
      {importDetails.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>Kết quả chi tiết</Card.Header>
              <Card.Body className="p-0">
                <Table responsive bordered hover size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Hàng (Excel)</th>
                      <th>Trạng thái</th>
                      <th>Room ID</th>
                      <th>Tiêu đề</th>
                      <th>Lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importDetails.slice(0, 100).map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.index || ''}</td>
                        <td>
                          {r.status === 'ok' ? (
                            <Badge bg="success">OK</Badge>
                          ) : (
                            <Badge bg="danger">Lỗi</Badge>
                          )}
                        </td>
                        <td>{r.id || ''}</td>
                        <td>{r.title || ''}</td>
                        <td className="text-danger">{r.error || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Tên phòng</th>
                    <th>Địa chỉ</th>
                    <th>Giá (VNĐ/tháng)</th>
                    <th>Trạng thái</th>
                    <th>Số booking</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {roomsLoading ? (
                    <tr><td colSpan={6}><div className="d-flex align-items-center"><Spinner size="sm" className="me-2" />Đang tải...</div></td></tr>
                  ) : rooms.map((room) => (
                    <tr key={room.id}>
                      <td>{room.title}</td>
                      <td>{room.address || '-'}</td>
                      <td>{(Number(room.price) || 0).toLocaleString()}</td>
                      <td>
                        {room.status === 'available' ? (
                          <Badge bg="success">Còn trống</Badge>
                        ) : (
                          <Badge bg="warning">Đã thuê</Badge>
                        )}
                      </td>
                      <td>-</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openEdit(room.id)}>
                          Sửa
                        </Button>
                        <Button variant="outline-info" size="sm" className="me-2">
                          Xem
                        </Button>
                        <Button variant="outline-danger" size="sm">
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer>
              <div className="d-flex justify-content-between align-items-center">
                <div>Trang {page} / {totalPages}</div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" disabled={page <= 1 || roomsLoading} onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}>Trước</Button>
                  <Button variant="outline-secondary" size="sm" disabled={page >= totalPages || roomsLoading} onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}>Sau</Button>
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      <AdminCreateRoomForm 
        show={showCreate} 
        onHide={() => setShowCreate(false)} 
        onCreated={() => setShowCreate(false)}
      />

      <Modal show={showEdit} onHide={() => setShowEdit(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Sửa phòng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingLoading ? (
            <div className="d-flex align-items-center"><Spinner className="me-2" />Đang tải...</div>
          ) : (
            <>
              <Form className="mb-3">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Tiêu đề</Form.Label>
                      <Form.Control name="title" value={editForm.title} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Giá (VNĐ)</Form.Label>
                      <Form.Control name="price" type="number" value={editForm.price} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Diện tích (m²)</Form.Label>
                      <Form.Control name="area" type="number" value={editForm.area} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select name="status" value={editForm.status} onChange={handleEditFormChange}>
                        <option value="available">Còn trống</option>
                        <option value="occupied">Đã thuê</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Địa chỉ</Form.Label>
                      <Form.Control name="address" value={editForm.address} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Thành phố</Form.Label>
                      <Form.Control name="city" value={editForm.city} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Quận/Huyện</Form.Label>
                      <Form.Control name="district" value={editForm.district} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Phường/Xã</Form.Label>
                      <Form.Control name="ward" value={editForm.ward} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Mô tả</Form.Label>
                      <Form.Control as="textarea" rows={3} name="description" value={editForm.description} onChange={handleEditFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Banner URL</Form.Label>
                      <Form.Control name="banner" value={editForm.banner} onChange={handleEditFormChange} />
                      <div className="mt-2">
                        {editForm.banner ? (
                          <Image src={editForm.banner} alt="banner" thumbnail style={{ maxHeight: 160, objectFit: 'cover' }} />
                        ) : (
                          <span className="text-muted">Chưa có banner - nhập URL hoặc dùng API upload banner</span>
                        )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Hình ảnh</strong>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control type="file" multiple accept="image/*" onChange={handleUploadFilesChange} style={{ maxWidth: 260 }} />
                    <Button size="sm" variant="primary" onClick={handleUploadAndAddImages} disabled={addingImages || uploadFiles.length === 0}>
                      {addingImages ? 'Đang thêm...' : 'Thêm ảnh'}
                    </Button>
                  </div>
                </div>
                <Row className="g-2">
                  {editImages.map((img) => (
                    <Col key={img.id} xs={6} md={4} lg={3}>
                      <div className="border rounded p-1 h-100 d-flex flex-column">
                        <Image src={img.url} alt="room" thumbnail style={{ objectFit: 'cover', height: 120 }} />
                        <div className="d-flex gap-2 mt-2">
                          <Button variant={editForm.banner === img.url ? 'success' : 'outline-success'} size="sm" onClick={() => handleSetBannerFromImage(img.url)}>
                            {editForm.banner === img.url ? 'Đang là banner' : 'Đặt làm banner'}
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteImage(img.id)}>Xóa</Button>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Đóng</Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? 'Đang lưu...' : 'Lưu'}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageRoomsPage;
