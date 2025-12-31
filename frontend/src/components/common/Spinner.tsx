import React from 'react';

const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 32, className }) => {
  const border = Math.max(2, Math.round(size / 16));
  return (
    <div
      className={`animate-spin rounded-full border-t-transparent ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        borderWidth: border,
        borderColor: 'rgba(0,0,0,0.2)',
        borderTopColor: 'rgba(0,0,0,0.6)'
      }}
    />
  );
};

export default Spinner;
