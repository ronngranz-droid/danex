import { createApp } from './app';

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[DaneX Backend] Server is running on port ${PORT}`);
  console.log(`[DaneX Backend] Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`[DaneX Backend] Usage:  http://localhost:${PORT}/api/v1/usage`);
});
