import React from 'react';
import {
  Box,
  Container,
  Stack,
  styled,
} from '@mui/material';
import SearchBar from '../components/SearchBar';
import PapersList from '../components/PapersList';
import ChatInterface from '../components/ChatInterface';
import Navbar from '../components/Navbar';
import { Paper } from '../types';

// Main Content Container
const MainContent = styled(Box)({
  marginTop: '64px', // Same as navbar height
  width: '100%',
  padding: '24px',
});

const Home = () => {
  return (
    <>
      <Navbar />
      <MainContent>
        <Container maxWidth="xl">
          <Stack spacing={4} alignItems="center">
            <SearchBar
              onSearch={function (topic: string, maxResults: number, years: number): void {
                throw new Error('Function not implemented.');
              }}
              isLoading={false}
            />
            <Box display="flex" gap={2} width="100%">
              <PapersList
                papers={[]}
                onSelectPaper={function (paper: Paper): void {
                  throw new Error('Function not implemented.');
                }}
                selectedPapers={[]}
              />
              <ChatInterface
                onSendMessage={function (message: string): Promise<void> {
                  throw new Error('Function not implemented.');
                }}
                isLoading={false}
                messages={[]}
              />
            </Box>
          </Stack>
        </Container>
      </MainContent>
    </>
  );
};

export default Home;