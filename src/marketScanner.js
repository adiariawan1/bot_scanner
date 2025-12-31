// File: src/marketScanner.js
const axios = require("axios");
const { parse } = require("dotenv");

// --- SETUP API ---
// Kita pisah fungsi request biar bisa dipakai bareng-bareng

let marketDataCache = null;
let lastCacheTime = 0;
let onGoingFetch = null;
const CACHE_DURATION = 60 * 1000; // 1 menit

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
      console.error("❌ Gagal fetch Binance:", error.message);
      return [];
    } finally {
      onGoingFetch = null;
    }
  })();
  return onGoingFetch;
};

// --- FUNGSI 1: SCANNER UTAMA (STRATEGI GABUNGAN) ---
const scanMarket = async () => {
  // ... (Kode scanMarket yang tadi, kita singkat biar gak kepanjang)
  // ... Kamu bisa copy isi scanMarket dari jawaban sebelumnya di sini
  // ... Intinya dia return koin yang lolos filter 3 strategi

  // SAYA TULIS ULANG VERSI SINGKATNYA (BIAR KAMU GAK BINGUNG COPAS):
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

// --- FUNGSI 2: FITUR TRENDING (BARU) ---
const getTrendingCoins = async () => {
  console.log("📈 Mengambil data Trending...");
  const allCoins = await fetchBinanceData();

  // 1. Ambil Top 5 Gainers (Kenaikan Tertinggi)
  // Kita filter dulu yang volumenya gak nol biar gak koin mati
  const gainers = [...allCoins] // Copy array biar gak rusak
    .filter((c) => parseFloat(c.quoteVolume) > 1000000) // Minimal volume 1 Juta (biar valid)
    .sort(
      (a, b) =>
        parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)
    )
    .slice(0, 5); // Ambil 5 teratas

  // 2. Ambil Top 5 Volume (Paling Rame)
  const topVol = [...allCoins]
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 5); // Ambil 5 teratas

  return { gainers, topVol }; // Kembalikan 2 list sekaligus
};

// Export KEDUA fungsi
module.exports = { scanMarket, getTrendingCoins };
