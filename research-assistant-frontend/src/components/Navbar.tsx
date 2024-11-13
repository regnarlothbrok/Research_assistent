import React from 'react';
import {
  AppBar,
  Typography,
  styled,
} from '@mui/material';

const StyledNavbar = styled(AppBar)({
  backgroundColor: '#FFD700',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  width: '100%',
  minHeight: '56px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: 'none',
  padding: '8px 0',
  zIndex: 1100,
});

const HeaderTitle = styled('h1')({  // Changed from Typography to h1
  fontSize: '2rem',
  fontWeight: 400,
  color: '#000',
  textAlign: 'center',
  width: '100%',
  lineHeight: 1.2,
  margin: 0,
  padding: 0,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
});

const Navbar = () => {
  return (
    <StyledNavbar>
      <HeaderTitle>
        Research Assistant
      </HeaderTitle>
    </StyledNavbar>
  );
};

export default Navbar;