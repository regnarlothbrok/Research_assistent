import React from 'react';
import {
  Paper as MuiPaper,
  List,
  ListItem,
  Typography,
  Chip,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Paper } from '../types';

interface PapersListProps {
  papers: Paper[];
  onSelectPaper: (paper: Paper) => void;
  selectedPapers: Paper[];
}

const PapersList: React.FC<PapersListProps> = ({
  papers,
  onSelectPaper,
  selectedPapers,
}) => {
  return (
    <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
      {papers.map((paper, index) => (
        <ListItem key={index} sx={{ mb: 2 }}>
          <MuiPaper
            elevation={3}
            sx={{
              p: 2,
              width: '100%',
              cursor: 'pointer',
              bgcolor: selectedPapers.some((p) => p.title === paper.title)
                ? 'action.selected'
                : 'background.paper',
            }}
            onClick={() => onSelectPaper(paper)}
          >
            <Typography variant="h6" gutterBottom>
              {paper.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {paper.authors.join(', ')}
            </Typography>
            <Chip
              label={`Published: ${paper.published}`}
              size="small"
              sx={{ mb: 1 }}
            />
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Abstract</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {paper.abstract || 'No abstract available'}
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Box sx={{ mt: 2 }}>
              <Link href={paper.url} target="_blank" rel="noopener noreferrer">
                View Paper
              </Link>
            </Box>
          </MuiPaper>
        </ListItem>
      ))}
    </List>
  );
};

export default PapersList;