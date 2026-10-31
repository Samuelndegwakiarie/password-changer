import { buildServer } from './server.js';

const server = buildServer();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = '0.0.0.0';

server.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Recoverly API running at ${address}`);
});
