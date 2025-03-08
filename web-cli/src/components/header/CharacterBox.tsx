import React from 'react';
import { CharacterBoxProps } from '../../types/types';
import './HeaderStyles.css';

const CharacterBox: React.FC<CharacterBoxProps> = ({ character }) => {
  return (
    <div className='character-box'>
      <h3>Character</h3>
      <div className='character-content'>
        <span className='character-prefix'>&gt;</span> {character} <span className='character-cursor'>_</span>
      </div>
    </div>
  );
};

export default CharacterBox;
