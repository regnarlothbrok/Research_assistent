import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Stack,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  onSearch: (topic: string, maxResults: number, years: number) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [years, setYears] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(topic, maxResults, years);
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3 }}>
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Research Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Max Results"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              inputProps={{ min: 1, max: 50 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Years Back"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              inputProps={{ min: 1, max: 20 }}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={<SearchIcon />}
          size="large"
        >
          Search Papers
        </Button>
      </Stack>
    </Paper>
  );
};

export default SearchBar;