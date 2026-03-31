import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({
  children,
  className = ''
}) => {
  return <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
};
export const CardHeader: React.FC<CardProps> = ({
  children,
  className = ''
}) => {
  return <div className={`px-4 py-5 sm:px-6 border-b border-gray-200 ${className}`}>
      {children}
    </div>;
};
export const CardBody: React.FC<CardProps> = ({
  children,
  className = ''
}) => {
  return <div className={`px-4 py-5 sm:p-6 ${className}`}>{children}</div>;
};