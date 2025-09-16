import React, { useEffect, useMemo, useState, useRef } from 'react';
import supabase from '../config/supabaseClient';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';


const AdminCreateRoomForm = ({ show, onHide, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({ targets: [], surroundings: [], amenities: [] });

  const [form, setForm] = useState({
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
  const [displayPrice, setDisplayPrice] = useState('');
  const editorRef = useRef(null);
  const [selected, setSelected] = useState({ targets: new Set(), surroundings: new Set(), amenities: new Set() });
  const [imageUrls, setImageUrls] = useState(['']);
  const [files, setFiles] = useState([]);
  // Banner sẽ chọn từ danh sách ảnh phía dưới hoặc tự động lấy ảnh đầu tiên

  const token = useMemo(() => localStorage.getItem('access_token') || '', []);

  useEffect(() => {
    if (!show) return;
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [targets, surroundings, amenities] = await Promise.all([
          supabase.from('targets').select('id, name').order('name'),
          supabase.from('surroundings').select('id, name').order('name'),
          supabase.from('amenities').select('id, name').order('name')
        ]);
        const anyErr = targets.error || surroundings.error || amenities.error;
        if (anyErr) throw anyErr;
        setOptions({
          targets: targets.data || [],
          surroundings: surroundings.data || [],
          amenities: amenities.data || []
        });
        setError('');
      } catch (err) {
        setError(err.message || 'Lỗi không xác định');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [show, token]);

  const toggleSelect = (group, id, checked) => {
    setSelected(prev => {
      const next = new Set(prev[group]);
      if (checked) next.add(id); else next.delete(id);
      return { ...prev, [group]: next };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  
  // Format number with dots as thousand separators
  const formatPrice = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Remove dots and convert to number
  const unformatPrice = (value) => {
    if (!value) return '';
    return value.replace(/\./g, '');
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/\./g, ''); // Remove existing dots
    if (value === '' || /^\d+$/.test(value)) { // Only allow numbers
      setForm(prev => ({ ...prev, price: value }));
      setDisplayPrice(formatPrice(value));
    }
  };

  const handleDescriptionChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setForm(prev => ({ ...prev, description: content }));
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    handleDescriptionChange();
  };

  const insertList = (type) => {
    formatText(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const handleImageUrlChange = (idx, value) => {
    setImageUrls(prev => prev.map((u, i) => (i === idx ? value : u)));
  };

  const addImageField = () => setImageUrls(prev => [...prev, '']);
  const removeImageField = (idx) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const handleFilesChange = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  // Không còn upload banner riêng

  // Simple client-side image compression via Canvas -> WebP
  const compressWithCanvas = async (file, { maxDim = 1600, quality = 0.8, type = 'image/webp' } = {}) => {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Không upload banner riêng nữa
      let bannerUrlFromUpload = null;

      // Upload files first (if any)
      let uploadedUrls = [];
      if (files.length > 0) {
        const bucket = process.env.REACT_APP_SB_ROOM_IMAGES_BUCKET || 'room-images';
        for (const f of files) {
          const compressed = await compressWithCanvas(f, { maxDim: 1280, quality: 0.75, type: 'image/webp' });
          const path = `rooms/new/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
          const { error: upErr } = await supabase.storage.from(bucket).upload(path, compressed, { upsert: true, cacheControl: '3600' });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
        }
      }

      // Nếu chưa chọn banner và có URL ảnh từ input, chọn cái đầu tiên
      let chosenBanner = bannerUrlFromUpload || (form.banner ? form.banner.trim() : null);
      const urlInputs = imageUrls.map(u => u.trim()).filter(Boolean);
      if (!chosenBanner && urlInputs.length > 0) {
        chosenBanner = urlInputs[0];
      }

      const payload = {
        room: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          price: Number(form.price),
          area: form.area ? Number(form.area) : null,
          address: form.address.trim(),
          city: form.city.trim() || null,
          district: form.district.trim() || null,
          ward: form.ward.trim() || null,
          status: form.status || 'available',
          banner: chosenBanner || null
        },
        targets: Array.from(selected.targets),
        surroundings: Array.from(selected.surroundings),
        amenities: Array.from(selected.amenities),
        images: [...uploadedUrls, ...urlInputs]
      };

      if (!payload.room.title || !payload.room.address || !(payload.room.price >= 0)) {
        setError('Vui lòng nhập đủ Tiêu đề, Địa chỉ và Giá');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('rooms').insert(payload.room).select().maybeSingle();
      if (error) throw error;
      // Insert relations if provided
      const roomId = data?.id;
      if (roomId) {
        if (payload.targets.length > 0) {
          const targetRows = payload.targets.map(tid => ({ room_id: roomId, target_id: tid }));
          await supabase.from('room_targets').insert(targetRows);
        }
        if (payload.surroundings.length > 0) {
          const surRows = payload.surroundings.map(sid => ({ room_id: roomId, surrounding_id: sid }));
          await supabase.from('room_surroundings').insert(surRows);
        }
        if (payload.amenities.length > 0) {
          const amenityRows = payload.amenities.map(aid => ({ room_id: roomId, amenity_id: aid }));
          await supabase.from('room_amenities').insert(amenityRows);
        }
        if (payload.images.length > 0) {
          const imageRows = payload.images.map(u => ({ room_id: roomId, image_url: u }));
          await supabase.from('room_images').insert(imageRows);
        }
      }
      if (onCreated) onCreated(data);
      onHide();
    } catch (err) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm phòng mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingOptions ? (
          <div className="d-flex align-items-center justify-content-center py-4">
            <Spinner animation="border" size="sm" className="me-2" /> Đang tải ...
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger py-2">{error}</div>
            )}
            <Row className="g-3">
              <Col md={8}>
                <Form.Group className="mb-2">
                  <Form.Label>Tiêu đề</Form.Label>
                  <Form.Control name="title" value={form.title} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Mô tả</Form.Label>
                         {/* Custom Rich Text Editor Toolbar */}
                         <div className="border rounded-top p-2 bg-light" style={{ borderBottom: 'none' }}>
                    <div className="btn-group me-2" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => formatText('bold')}
                        title="Bold"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => formatText('italic')}
                        title="Italic"
                      >
                        <em>I</em>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => formatText('underline')}
                        title="Underline"
                      >
                        <u>U</u>
                      </button>
                    </div>
                    <div className="btn-group me-2" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => formatText('formatBlock', 'h3')}
                        title="Header"
                      >
                        H3
                      </button>
                    </div>
                    <div className="btn-group me-2" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertList('bullet')}
                        title="Bullet List"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertList('ordered')}
                        title="Numbered List"
                      >
                        1.
                      </button>
                    </div>
                  </div>
                  {/* Rich Text Editor Content */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleDescriptionChange}
                    className="form-control"
                    style={{ 
                      minHeight: '300px', 
                      borderTopLeftRadius: 0, 
                      borderTopRightRadius: 0,
                      outline: 'none',
                      padding: '12px'
                    }}
                    placeholder="Nhập mô tả chi tiết về phòng..."
                    suppressContentEditableWarning={true}
                  />
                </Form.Group>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Giá (VNĐ/tháng)</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="price" 
                        value={displayPrice || form.price} 
                        onChange={handlePriceChange} 
                        
                        required 
                      />
                      {form.price && (
                        <Form.Text className="text-muted">
                          Giá trị: {Number(form.price).toLocaleString('vi-VN')} VNĐ
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Diện tích (m²)</Form.Label>
                      <Form.Control type="number" min={0} step="0.1" name="area" value={form.area} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-2">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control name="address" value={form.address} onChange={handleChange} required />
                </Form.Group>
                <Row className="g-2">
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Thành phố</Form.Label>
                      <Form.Control name="city" value={form.city} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Quận/Huyện</Form.Label>
                      <Form.Control name="district" value={form.district} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Phường/Xã</Form.Label>
                      <Form.Control name="ward" value={form.ward} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select name="status" value={form.status} onChange={handleChange}>
                        <option value="available">Còn trống</option>
                        <option value="rented">Đã thuê</option>
                        <option value="hidden">Ẩn</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Banner (tuỳ chọn)</Form.Label>
                      <Form.Text className="text-muted d-block">Nếu để trống, hệ thống sẽ dùng ảnh đầu tiên bên dưới.</Form.Text>
                      <Form.Control className="mt-2" name="banner" value={form.banner} onChange={handleChange} placeholder="https://... (tuỳ chọn)" />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="mt-2">
                  <Form.Label>Ảnh phòng (tải lên)</Form.Label>
                  <Form.Control type="file" multiple accept="image/*" onChange={handleFilesChange} className="mb-2" />
                  <Form.Text className="text-muted">Có thể chọn nhiều ảnh. Hoặc nhập URL bên dưới.</Form.Text>
                </div>
                <div className="mt-2">
                  <Form.Label>Ảnh phòng (URL)</Form.Label>
                  {imageUrls.map((url, idx) => (
                    <Row className="g-2 mb-2" key={idx}>
                      <Col>
                        <Form.Control value={url} onChange={(e) => handleImageUrlChange(idx, e.target.value)} placeholder="https://..." />
                      </Col>
                      <Col xs="auto">
                        <Button variant="outline-danger" onClick={() => removeImageField(idx)} disabled={imageUrls.length === 1}>Xoá</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button variant="outline-primary" size="sm" onClick={addImageField}>+ Thêm ảnh</Button>
                </div>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Đối tượng</Form.Label>
                  <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {options.targets.map(item => (
                      <Form.Check
                        key={item.id}
                        type="checkbox"
                        id={`target-${item.id}`}
                        label={item.name}
                        onChange={(e) => toggleSelect('targets', item.id, e.target.checked)}
                      />
                    ))}
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Môi trường xung quanh</Form.Label>
                  <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {options.surroundings.map(item => (
                      <Form.Check
                        key={item.id}
                        type="checkbox"
                        id={`sur-${item.id}`}
                        label={item.name}
                        onChange={(e) => toggleSelect('surroundings', item.id, e.target.checked)}
                      />
                    ))}
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Tiện nghi</Form.Label>
                  <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {options.amenities.map(item => (
                      <Form.Check
                        key={item.id}
                        type="checkbox"
                        id={`amenity-${item.id}`}
                        label={item.name}
                        onChange={(e) => toggleSelect('amenities', item.id, e.target.checked)}
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <Button variant="secondary" onClick={onHide}>Huỷ</Button>
              <Button type="submit" variant="success" disabled={loading}>
                {loading ? (<><Spinner size="sm" className="me-2" />Đang lưu...</>) : 'Tạo phòng'}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AdminCreateRoomForm;


