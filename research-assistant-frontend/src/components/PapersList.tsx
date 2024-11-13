import React, { useState } from 'react';
import {
  List,
  ListItem,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  IconButton,
  Collapse,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/system';
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
          <PaperCard
            paper={paper}
            onSelectPaper={() => onSelectPaper(paper)}
            isSelected={selectedPapers.some((p) => p.title === paper.title)}
          />
        </ListItem>
      ))}
    </List>
  );
};

// Define props for PaperCard
interface PaperCardProps {
  paper: Paper;
  onSelectPaper: () => void;
  isSelected: boolean;
}

// PaperCard component for displaying individual paper details
const PaperCard: React.FC<PaperCardProps> = ({ paper, onSelectPaper, isSelected }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <StyledCard isSelected={isSelected} onClick={onSelectPaper}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {paper.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {paper.authors.join(', ')}
        </Typography>
        <Box sx={{ mt: 1, mb: 2 }}>
          <Chip
            label={`Published: ${paper.published}`}
            size="small"
            sx={{ backgroundColor: '#e0e0e0', color: 'text.secondary' }}
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" alignItems="center">
          <Typography variant="body2" fontWeight="bold">
            Abstract
          </Typography>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
            sx={{ ml: 'auto' }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {paper.abstract || 'No abstract available'}
          </Typography>
        </Collapse>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the card from being selected when clicking this button
              window.open(paper.url, '_blank');
            }}
          >
            View Paper
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

// Styled component for PaperCard with isSelected prop
const StyledCard = styled(Card)<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  borderRadius: '12px',
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'box-shadow 0.3s ease-in-out',
  backgroundColor: isSelected ? theme.palette.action.selected : theme.palette.background.paper,
  '&:hover': {
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.15)',
  },
  cursor: 'pointer',
}));

export default PapersList;
