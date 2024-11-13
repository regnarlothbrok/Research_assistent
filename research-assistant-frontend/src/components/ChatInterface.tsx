import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { Message } from '../types';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  messages: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  isLoading,
  messages,
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus on text field when component mounts
  useEffect(() => {
    textFieldRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (message.trim() && !isLoading) {
      try {
        await onSendMessage(message);
        setMessage('');
        textFieldRef.current?.focus();
      } catch (err) {
        setError('Failed to send message. Please try again.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Chat Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SmartToyIcon />
          <Typography variant="h6">Research Assistant</Typography>
        </Stack>
        <Tooltip title="Clear chat">
          <IconButton 
            size="small" 
            sx={{ color: 'white' }}
            onClick={() => window.location.reload()}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        p: 2, 
        overflow: 'auto',
        bgcolor: 'grey.50'
      }}>
        <Stack spacing={2}>
          {messages.length === 0 && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                color: 'text.secondary',
                py: 4
              }}
            >
              <SmartToyIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
              <Typography>
                Start by asking a question about the research papers.
              </Typography>
            </Box>
          )}
          
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              {msg.sender === 'assistant' && (
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToyIcon />
                </Avatar>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.sender === 'user' ? 'primary.main' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'text.primary',
                  borderRadius: msg.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              </Paper>
              {msg.sender === 'user' && (
                <Avatar sx={{ bgcolor: 'grey.500' }}>
                  <PersonIcon />
                </Avatar>
              )}
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SmartToyIcon />
              </Avatar>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: '20px 20px 20px 5px',
                }}
              >
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        {error && (
          <Typography color="error" variant="caption" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            size="small"
            multiline
            maxRows={4}
            inputRef={textFieldRef}
            InputProps={{
              sx: { borderRadius: 3 }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!message.trim() || isLoading}
            endIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ borderRadius: 3 }}
          >
            Send
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default ChatInterface;