
const axios = require("axios");
const { parse } = require("dotenv");


let marketDataCache = null;
let lastCacheTime = 0;
let onGoingFetch = null;
const CACHE_DURATION = 60 * 1000; 

const fetchBinanceData = async () => {
  const now = Date.now();
  if (marketDataCache && now - lastCacheTime < CACHE_DURATION) {
    return marketDataCache;
  }

  if (onGoingFetch) {
    return onGoingFetch;
  }

   onGoingFetch = (async () => {
    try {
      const response = await axios.get(
        "https://api.binance.com/api/v3/ticker/24hr",
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/json",
          },
        }
      );
      const cleanData = response.data.filter(
        (coin) =>
          coin.symbol.endsWith("USDT") &&
          !coin.symbol.includes("UP") &&
          !coin.symbol.includes("DOWN")
      );

      marketDataCache = cleanData;
      lastCacheTime = Date.now();
      return cleanData;
    } catch (error) {
      console.error("Gagal fetch Binance:", error.message);
      return [];
    } finally {
      onGoingFetch = null;
    }
  })();
  return onGoingFetch;
};

const scanMarket = async () => {
  const allCoins = await fetchBinanceData();
  let qualified = [];

  allCoins.forEach((c) => {
    const price = parseFloat(c.lastPrice);
    const volumeUSDT = parseFloat(c.quoteVolume);
    const change24h = parseFloat(c.priceChangePercent);

    const isHighPump = volumeUSDT > 100000000 && change24h > 2.5;

    const isMidPump = volumeUSDT > 10000000 && change24h > 5.0;

    const ismGemPump = volumeUSDT > 1000000 && change24h > 10.0;
    if (isHighPump || isMidPump || ismGemPump) {
      let tag = "";
      if (isHighPump) tag = "🐋 WHALE";
      else if (isMidPump) tag = "🐬 Mid-Pump";
      else tag = "💎 Hidden Gems";

      qualified.push({
        symbol: c.symbol.replace("USDT", ""),
        price: parseFloat(c.lastPrice),
        change: change24h.toFixed(2),
        volume: (volumeUSDT / 1000000).toFixed(1) + "M",
        tag: tag,
        score: change24h,
        url: `https://www.binance.com/en/trade/${c.symbol}`,
      });
    }
  });
  return qualified.sort((a, b) => b.change - a.change);
};

const getTrendingCoins = async () => {
  console.log("📈 Mengambil data Trending...");
  const allCoins = await fetchBinanceData();
  const gainers = [...allCoins] 
    .filter((c) => parseFloat(c.quoteVolume) > 1000000) 
    .sort(
      (a, b) =>
        parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)
    )
    .slice(0, 5); 

  const topVol = [...allCoins]
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 5); 

  return { gainers, topVol }; 
};


module.exports = { scanMarket, getTrendingCoins };
