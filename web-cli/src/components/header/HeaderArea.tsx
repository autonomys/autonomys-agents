import React from 'react';
import CharacterBox from './CharacterBox';
import LogoBox from './LogoBox';
import ClockBox from './ClockBox';
import './HeaderStyles.css';

/* eslint-disable no-undef */
const characterName = process.env.REACT_APP_CHARACTER || 'default';
/* eslint-enable no-undef */

const HeaderArea: React.FC = () => {
  return (
    <div className='header-area'>
      <CharacterBox character={characterName} />
      <LogoBox />
      <ClockBox time={new Date()} />
    </div>
  );
};

export default HeaderArea;
