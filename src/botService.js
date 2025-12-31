const bot = require("../config/connectionBot");
// Hapus getTotalUsers karena kita tidak pakai fitur member count lagi
const { saveUser } = require("../config/connectionDataBase"); 
const { scanMarket, getTrendingCoins } = require("./marketScanner");

const runBotService = () => {
  const mainMenu = {
    reply_markup: {
      keyboard: [
        ["🚀 SCAN MARKET", "📈 TRENDING"],
        ["ℹ️ INFO BOT", "💰 DONATE"], 
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const Text = msg.text;
    
    // --- 1. PERBAIKAN LOGIKA USER (ANTI CRASH) ---
    const rawUser = msg.from || {}; // Ambil object user utuh
    const username = rawUser.username || ''; // Kalau gak ada username, kasih kosong
    // Kalau gak ada nama, panggil 'Trader'
    const firstName = rawUser.first_name || 'Trader'; 

    // Simpan data yang benar ke database
    saveUser(chatId, username, firstName);

    console.log("Message received from ", firstName, ": ", Text);

    if (Text === "/start") {
      bot.sendMessage(
        chatId,
        `Hello *${firstName}*! 👋\nWelcome to V-Hunter Bot.\nPlease select a menu below:`,
        { parse_mode: "Markdown", ...mainMenu }
      );
    } 
    
    else if (Text === "🚀 SCAN MARKET") {
      bot.sendMessage(chatId, "🕵️ *Scanning Market...*", { parse_mode: "Markdown" });

      const results = await scanMarket();

      if (results.length === 0) {
        bot.sendMessage(
          chatId,
          "🛡️ *No opportunities found.*\nMarket is currently *Sideways* or *Bearish*.\n\n_Strategy suggests: Wait & See._",
          { parse_mode: "Markdown" }
        );
      } else {
        let message = `💎 *SCAN RESULTS* 💎\n`;
        message += `Potential Markets:\n\n`;

        results.slice(0, 10).forEach((coin, index) => {
          message += `${index + 1}. *${coin.symbol}* [${coin.tag}] (+${coin.change}%)\n`;
          message += `   💵 $${coin.price} | 📊 Vol: ${coin.volume}\n`;
          message += `   ⭐ Score: ${coin.score}\n`;
          message += `   🔗 [Trade Now](${coin.url})\n\n`;
        });

        message += `_Tip: ${results[0].symbol} has the highest momentum score._ Always DYOR!`;

        bot.sendMessage(chatId, message, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        });
      }
    } 
    
    else if (Text === "📈 TRENDING") {
      bot.sendMessage(chatId, `🔄 Fetching trends...`);
      try {
        const data = await getTrendingCoins();
        let message = `📊 *TRENDING COINS* 📊\n\n`;
        
        message += `🚀 *TOP GAINERS (24h)*\n`;
        data.gainers.forEach((c, i) => {
          const symbol = c.symbol.replace("USDT", "");
          const change = parseFloat(c.priceChangePercent).toFixed(2);
          const price = parseFloat(c.lastPrice);
          message += `${i + 1}. *${symbol}* (+${change}%) - $${price}\n`;
        });

        message += `\n💰 *TOP VOLUME (Whales)*\n`;
        // Pastikan data.topVol ada isinya (ditangani di marketScanner)
        if(data.topVol) {
            data.topVol.forEach((c, i) => {
              const symbol = c.symbol.replace("USDT", "");
              const vol = (parseFloat(c.quoteVolume) / 1000000).toFixed(0);
              const change = parseFloat(c.priceChangePercent).toFixed(2);
              message += `${i + 1}. *${symbol}* ($${vol}M) | ${change}%\n`;
            });
        }

        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
      } catch (error) {
        console.log(error);
        bot.sendMessage(chatId, "❌ Failed to fetch trending data.");
      }
    } 
    
    else if (Text === "ℹ️ INFO BOT") {
       
       const guide = `🤖 *V-HUNTER GUIDE*\n` +
             `Hello, *${firstName}*! 👋\n` +
             `Here is how to use your personal crypto assistant:\n\n` +
             
             `🚀 *SCAN MARKET*\n` +
             `Scans Binance for coins with **High Volume** & **Momentum**. ` +
             `Use this to find potential coins for day trading (Scalping/Intraday).\n\n` +

             `📈 *TRENDING*\n` +
             `Displays the **Top 5 Gainers** (highest price increase) ` +
             `in the last 24 hours. Good for checking market sentiment.\n\n` +

             `💰 *DONATE*\n` +
             `Support the developer/server costs via USDT (Crypto).`;

       bot.sendMessage(chatId, guide, { parse_mode: 'Markdown' });
    } 
    
    else if (Text === "💰 DONATE") { 
      const walletAddress = "0x86705cc91a31D899a4AC5FAEE77b03E59a70C9f8";

      const pesan = `☕ *Support the Developer*\n\n` +
              `This bot runs on cloud servers and requires resources to stay online 24/7. ` +
              `Your contribution helps keep the service free and fast!\n\n` +
              `💎 *Donate via Crypto (USDT):*\n` +
              `Network: **BASE CHAIN (Base Mainnet)**\n` +
              `\`${walletAddress}\`\n\n` +
              `_(Tap the address above to copy)_`;

      bot.sendMessage(chatId, pesan, { 
        parse_mode: 'Markdown', 
        disable_web_page_preview: true 
      });
    } else {
    //   bot.sendMessage(chatId, `You said: ${Text}`); // Opsional: Matikan biar gak berisik kalau user iseng
    }
  });
};

module.exports = runBotService;