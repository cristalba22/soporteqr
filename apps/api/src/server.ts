import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`SoporteQR API escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
});
