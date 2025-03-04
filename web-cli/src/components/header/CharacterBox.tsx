import React from 'react';
import { CharacterBoxProps } from '../../types/types';
import './HeaderStyles.css';

const CharacterBox: React.FC<CharacterBoxProps> = ({ character }) => {
  return (
    <div className="character-box">
      <h3>Character</h3>
      <div className="character-content">{character}</div>
    </div>
  );
};

export default CharacterBox; 