import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

const ReportContainer = styled.div`
  background-color: #f9f7f7;
  border-radius: 8px;
  padding: 20px;
  color: #333;
`;

const ReportTitle = styled.h2`
  margin-bottom: 20px;
`;

function ReportView() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    axios
      .get(`http://localhost:8000/reports/${id}`)
      .then(response => setReport(response.data))
      .catch(error => console.error('Error fetching report:', error));
  }, [id]);

  if (!report) return <p>Loading...</p>;

  return (
    <ReportContainer>
      <ReportTitle>{report.title}</ReportTitle>
      <ReactMarkdown>{report.content}</ReactMarkdown>
      <p>Created on: {new Date(report.created_at).toLocaleString()}</p>
    </ReportContainer>
  );
}

export default ReportView;
