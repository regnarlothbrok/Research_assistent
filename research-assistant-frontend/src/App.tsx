import React, { useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  Grid,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import SearchBar from './components/SearchBar';
import PapersList from './components/PapersList';
import ChatInterface from './components/ChatInterface';
import { searchPapers, chatWithAssistant } from './services/api';
import { Paper, Message } from './types';
import Navbar from './components/Navbar';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const App: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (topic: string, maxResults: number, years: number) => {
    setIsSearching(true);
    try {
      const response = await searchPapers(topic, maxResults, years);
      setPapers(response.papers);
      setCurrentTopic(topic);
      setSelectedPapers([]);
      setMessages([]);
    } catch (error) {
      setError('Failed to fetch papers. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPaper = (paper: Paper) => {
    setSelectedPapers((prev) => {
      const exists = prev.some((p) => p.title === paper.title);
      if (exists) {
        return prev.filter((p) => p.title !== paper.title);
      }
      return [...prev, paper];
    });
  };

  const handleSendMessage = async (message: string) => {
    if (!currentTopic) {
      setError('Please search for papers first.');
      return;
    }

    setMessages((prev) => [...prev, { content: message, sender: 'user' }]);
    setIsChatting(true);

    try {
      const response = await chatWithAssistant(currentTopic, message);
      setMessages((prev) => [
        ...prev,
        { content: response.response, sender: 'assistant' },
      ]);
    } catch (error) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <CssBaseline />

      <Container maxWidth="xl" sx={{ py: 4, mt: '80px' }}> {/* Added margin-top here */}
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Papers {papers.length > 0 && `(${papers.length})`}
            </Typography>
            <PapersList
              papers={papers}
              onSelectPaper={handleSelectPaper}
              selectedPapers={selectedPapers}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Chat
            </Typography>
            <Box sx={{ height: '600px' }}>
              <ChatInterface
                onSendMessage={handleSendMessage}
                isLoading={isChatting}
                messages={messages}
              />
            </Box>
          </Grid>
        </Grid>
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default App;
