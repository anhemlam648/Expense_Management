import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthenticated(!!data.session);
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

  return authenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
