import WalletConnect from "./WalletConnect";
import { Box, Typography } from '@mui/material';

function Header() {
  return (
    <Box sx={styles.header}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Hexed
        </Typography>
      </Box>

      <Box sx={styles.headerButtons}>
        <WalletConnect />
      </Box>
    </Box>
  );
}

export default Header;

const styles = {
  header: {
    width: '100%',
    height: '50px',
    borderBottom: '2px solid rgba(17, 17, 17, 1)',
    background: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    px: '10px'
  },
  headerButtons: {
    display: 'flex',
    height: '36px',
    alignItems: 'center',
    gap: 2
  }
};
