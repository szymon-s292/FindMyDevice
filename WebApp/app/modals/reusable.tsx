"use client";

import { ReactNode, useEffect, useState } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: ModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`${visible ? 'fixed inset-0' : 'hidden'} flex justify-center items-center bg-black/30 z-50 transition-opacity duration-200 px-8`}>
      <div
        className={`bg-white rounded-lg shadow-lg p-6 relative transform transition-all duration-200 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-1.5 right-3 text-xl text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
