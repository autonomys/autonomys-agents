import { InputGroup, InputLeftElement, Input } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useCallback } from 'react';
import { debounce } from 'lodash';
import { SetURLSearchParams } from 'react-router-dom';

interface SearchBarProps {
    setSearchParams: SetURLSearchParams;
    defaultValue: string;
}

function SearchBar({ setSearchParams, defaultValue }: SearchBarProps) {
    const handleSearch = useCallback(
        debounce((value: string) => {
            if (value) {
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    if (value.startsWith('@')) {
                        newParams.set('author', value.substring(1));
                        newParams.delete('search');
                    } else {
                        newParams.set('search', value);
                        newParams.delete('author');
                    }
                    return newParams;
                });
            } else {
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.delete('search');
                    newParams.delete('author');
                    return newParams;
                });
            }
        }, 500),
        [setSearchParams]
    );

    return (
        <InputGroup maxW="400px" flex={1}>
            <InputLeftElement pointerEvents="none">
                <SearchIcon color="#00ff00" />
            </InputLeftElement>
            <Input
                placeholder="Search tweets or @username"
                color="#00ff00"
                borderColor="#00ff00"
                _hover={{ borderColor: '#00ff00', boxShadow: '0 0 5px #00ff00' }}
                _focus={{ borderColor: '#00ff00', boxShadow: '0 0 10px #00ff00' }}
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={defaultValue}
            />
        </InputGroup>
    );
}

export default SearchBar; 