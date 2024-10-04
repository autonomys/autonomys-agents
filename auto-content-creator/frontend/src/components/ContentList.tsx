import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getContentList } from '../api/contentApi';

const ContentItem = styled.div`
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ContentLink = styled(Link)`
  text-decoration: none;
  color: #007bff;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
`;

interface Content {
  id: string;
  title: string;
  created_at: string;
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
              <p>Created at: {new Date(content.createdAt).toLocaleString()}</p>
            </ContentItem>
          ))}
          <PaginationControls>
            <button
              onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
              disabled={paginationInfo.currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
              disabled={paginationInfo.currentPage === paginationInfo.totalPages}
            >
              Next
            </button>
          </PaginationControls>
        </>
      )}
    </div>
  );
};

export default ContentList;
