import React from 'react';
import { getPageDimensions } from '../utils/layoutConfig';
import './Page.css';

const Page = ({ children, className = '', layoutConfig }) => {
  const dimensions = getPageDimensions(layoutConfig?.pageSize || 'letter');

  return (
    <div 
      className={`page ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      {children}
    </div>
  );
};

export default Page;
