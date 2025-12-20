import React from 'react';

// Glassmorphism / Premium Card
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm dark:shadow-xl transition-colors duration-300 ${className}`}>
    {children}
  </div>
);

// Large Touch-Friendly Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => (
  <div className={`flex flex-col gap-2 mb-4 ${className}`}>
    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1 transition-colors duration-300">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{icon}</div>}
      <input
        onWheel={(e) => e.currentTarget.blur()}
        className={`w-full h-14 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xl text-gray-900 dark:text-white px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${icon ? 'pl-12' : ''}`}
        {...props}
      />
    </div>
  </div>
);

// Primary Button
export const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; variant?: 'primary' | 'danger' | 'secondary', type?: 'button' | 'submit' | 'reset', disabled?: boolean, className?: string }> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  type = 'button',
  disabled = false,
  className = ''
}) => {
  const baseStyles = "w-full h-14 rounded-2xl font-bold text-lg active:scale-95 transition-transform flex items-center justify-center";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20",
    secondary: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white",
    danger: "bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/50",
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};