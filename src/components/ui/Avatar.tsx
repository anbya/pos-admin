import React from 'react';
interface AvatarProps {
  src?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
const Avatar: React.FC<AvatarProps> = ({
  src,
  fallback,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };
  return <div className={`relative inline-flex items-center justify-center rounded-full bg-gray-500 ${sizeClasses[size]} ${className}`}>
      {src ? <img src={src} alt={fallback} className="h-full w-full rounded-full object-cover" /> : <span className="font-medium text-white">{fallback}</span>}
    </div>;
};
export default Avatar;