import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getContentList } from '../api/contentApi';

const ContentItem = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
`;

const ContentLink = styled(Link)`
  text-decoration: none;
  color: #007bff;
  font-weight: bold;
  font-size: 18px;

  &:hover {
    text-decoration: underline;
  }
`;

const ContentInfo = styled.p`
  margin: 5px 0;
  color: #666;
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
`;

const PaginationButton = styled.button`
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

interface Content {
  id: number;
  category: string;
  topic: string;
  contentType: string;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

const ContentList: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchContents = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true);
    try {
      const data = await getContentList(page, limit);
      setContents(data.contents);
      setPaginationInfo({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
      });
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchContents(newPage);
  };

  return (
    <div>
      <h2>Content List</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {contents.map(content => (
            <ContentItem key={content.id}>
              <ContentLink to={`/content/${content.id}`}>{content.topic}</ContentLink>
              <ContentInfo>Category: {content.category}</ContentInfo>
              <ContentInfo>Type: {content.contentType}</ContentInfo>
              <ContentInfo>Created: {new Date(content.createdAt).toLocaleString()}</ContentInfo>
            </ContentItem>
          ))}
          <PaginationControls>
            <PaginationButton
              onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
              disabled={paginationInfo.currentPage === 1}
            >
              Previous
            </PaginationButton>
            <span>
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
            </span>
            <PaginationButton
              onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
              disabled={paginationInfo.currentPage === paginationInfo.totalPages}
            >
              Next
            </PaginationButton>
          </PaginationControls>
        </>
      )}
    </div>
  );
};

export default ContentList;
