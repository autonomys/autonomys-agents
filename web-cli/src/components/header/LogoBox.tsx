import React from 'react';
import './HeaderStyles.css';

const LogoBox: React.FC = () => {
  return (
    <div className='logo-box'>
      <div className='logo-content'>
        <div className='ascii-art'>
          <span className='ascii-bracket'>[</span>
          <span className='logo-svg-container'>
            <img 
              src={`${process.env.PUBLIC_URL}/assets/logo.svg`}
              alt="Autonomys Logo"
              className='logo-svg'
              width="30"
              height="30"
            />
          </span>
          <span className='ascii-bracket'>]</span>
        </div>
        <h1 className='logo-text'>Autonomys Agents</h1>
      </div>
    </div>
  );
};

export default LogoBox;
