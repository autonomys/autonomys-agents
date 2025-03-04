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

  return (
    <div className='clock-box'>
      <h3>Date & Time</h3>
      <div className='clock-content'>{currentTime.toISOString()}</div>
    </div>
  );
};

export default ClockBox;
