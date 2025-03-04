import React from 'react';
import CharacterBox from './CharacterBox';
import LogoBox from './LogoBox';
import ClockBox from './ClockBox';
import './HeaderStyles.css';

const characterName = process.env.REACT_APP_CHARACTER || 'default';

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
