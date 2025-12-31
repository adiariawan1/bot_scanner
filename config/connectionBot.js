require('dotenv').config();


const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

if (!process.env.BOT_TOKEN){
    console.error("Error: BOT_TOKEN tidak ditemukan.");
    process.exit(1);
}


const bot = new TelegramBot(token, { polling: true });

 module.exports = bot;

