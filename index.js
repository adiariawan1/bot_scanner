require('dotenv').config();
const http = require('http');

const runBotService = require('./src/botService');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
try {
    runBotService();
} catch (error) {
    console.error("Failed to run bot service:", error.message);
}
