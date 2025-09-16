import React, { useEffect, useState } from 'react';
import supabase from '../config/supabaseClient';

const OAuthCallback = () => {
  const [status, setStatus] = useState('Đang xử lý đăng nhập...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.access_token) {
          localStorage.setItem('access_token', session.access_token);
          // Fetch user and route by role
          const { data: got } = await supabase.auth.getUser();
          const u = got?.user;
          const roleMeta = String(u?.user_metadata?.role || '').trim().toLowerCase();
          console.log('[OAUTH] userId=', u?.id, 'meta.role=', roleMeta);
          setStatus('Đăng nhập thành công! Đang chuyển hướng...');
          setTimeout(async () => {
            try {
              if (roleMeta === 'admin') {
                window.location.replace('/admin/dashboard');
                return;
              }
              let { data: prof } = await supabase.from('profiles').select('id, role').eq('id', u?.id).maybeSingle();
              if (!prof && u?.id) {
                const defaultRole = roleMeta || 'renter';
                await supabase.from('profiles').insert({ id: u.id, name: u.email || 'User', role: defaultRole });
                const reget = await supabase.from('profiles').select('id, role').eq('id', u.id).maybeSingle();
                prof = reget.data || prof;
              }
              const roleDb = String(prof?.role || '').trim().toLowerCase();
              console.log('[OAUTH] profiles.role=', roleDb, 'profile=', prof);
              if (roleDb === 'admin') {
                window.location.replace('/admin/dashboard');
                return;
              }
            } catch (_) {}
            window.location.replace('/user-home');
          }, 800);
          return;
        }
        if (error) {
          setStatus(`Lỗi đăng nhập: ${error.message}`);
          setTimeout(() => { window.location.replace('/login'); }, 2000);
          return;
        }
        setStatus('Không tìm thấy phiên đăng nhập. Đang chuyển hướng về trang đăng nhập...');
        setTimeout(() => { window.location.replace('/login'); }, 2000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('Có lỗi xảy ra. Đang chuyển hướng về trang đăng nhập...');
        setTimeout(() => {
          window.location.replace('/login');
        }, 2000);
      }
    };

    handleOAuthCallback();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#333'
    }}>
      {status}
    </div>
  );
};

export default OAuthCallback;


