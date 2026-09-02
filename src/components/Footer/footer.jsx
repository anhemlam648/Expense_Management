import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto w-full bg-transparent px-4 py-3 text-center text-xs text-slate-500 sm:text-sm">
      © {new Date().getFullYear()} Vu Trung Nghia. All rights reserved.
    </footer>
  );
};

export default Footer;
