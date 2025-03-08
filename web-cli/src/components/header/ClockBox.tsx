import React, { useEffect, useState } from 'react';
import { ClockBoxProps } from '../../types/types';
import './HeaderStyles.css';

const ClockBox: React.FC<ClockBoxProps> = ({ time }) => {
  const [currentTime, setCurrentTime] = useState<Date>(time || new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format the date in YYYY-MM-DD format
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Format the time in HH:MM:SS format
  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  return (
    <div className='clock-box'>
      <h3>Date & Time</h3>
      <div className='clock-container'>
        <div className='clock-content date'>{formatDate(currentTime)}</div>
        <div className='clock-content time'>{formatTime(currentTime)}</div>
      </div>
    </div>
  );
};

export default ClockBox;
