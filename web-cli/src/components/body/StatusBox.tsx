import React from 'react';
import { StatusBoxProps } from '../../types/types';
import './BodyStyles.css';

const StatusBox: React.FC<StatusBoxProps> = ({ status }) => {
  return (
    <div className='status-box'>
      <h3>Status</h3>
      <div className='status-content'>{status}</div>
    </div>
  );
};

export default StatusBox;
