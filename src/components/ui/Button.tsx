// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const Button = ({ children, className, variant = 'primary', ...props }: ButtonProps) => {
  const baseStyle = "w-full text-center px-4 py-2.5 rounded-lg font-bold transition-all duration-200 ease-in-out transform hover:scale-[1.03] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-b-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  
  const variantStyles = {
    primary: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-800 hover:border-purple-700 focus:ring-purple-500',
    secondary: 'bg-slate-600 hover:bg-slate-500 text-white border-slate-800 hover:border-slate-700 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-500 text-white border-red-800 hover:border-red-700 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-500 text-white border-green-800 hover:border-green-700 focus:ring-green-500',
  };

  return (
    <button className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
