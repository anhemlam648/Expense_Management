import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-6 w-full bg-white/80 px-6 py-4 text-center text-sm text-slate-500 shadow-inner shadow-slate-300/20">
      © {new Date().getFullYear()} Vu Trung Nghia. All rights reserved.
    </footer>
  );
};

export default Footer;
