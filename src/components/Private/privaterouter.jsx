import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!supabase) {
      setAuthenticated(Boolean(storedToken && storedUser?.id));
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const hasSession = Boolean(data.session || (storedToken && storedUser?.id));
      setAuthenticated(hasSession);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return authenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
