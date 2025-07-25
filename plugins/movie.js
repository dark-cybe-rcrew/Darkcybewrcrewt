const { cmd } = require("../command");
const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache (1-minute TTL)
const searchCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// ======================
// CHAMA MD Theme
// ======================
const chamaTheme = {
  header: `╭━━╮╱╱╱╱╱╱╭╮
┃╭╮┃╱╱╱╱╱╱┃┃
┃╰╯╰┳━╮╭━━┫┃╭╮
┃╭━╮┃╭╮┫╭╮┃╰╯╯
┃╰━╯┃┃┃┃╰╯┃╭╮╮
╰━━━┻╯╰┻━━┻╯╰╯`,
  box: function(title, content) {
    return `${this.header}\n\n*${title}*\n\n${content}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ CHAMA MD*`;
  },
  getForwardProps: function() {
    return {
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        stanzaId: "CHAMA" + Math.random().toString(16).substr(2, 12).toUpperCase(),
        mentionedJid: [],
        conversionData: {
          conversionDelaySeconds: 0,
          conversionSource: "chama_md",
          conversionType: "message"
        }
      }
    };
  },
  resultEmojis: ["🟥", "🟦", "🟩", "🟧", "🟪", "⬜", "⬛", "🔶", "🔷", "🔸"]
};

// Film search and download command
cmd({
  pattern: "film",
  react: "🎬",
  desc: "Find movies with Sinhala subtitles from CHAMA MD collection",
  category: "chama kingdom",
  filename: __filename,
}, async (conn, mek, m, { from, q, pushname }) => {
  if (!q) {
    await conn.sendMessage(from, {
      text: chamaTheme.box("USAGE GUIDE", 
        "Usage: .film <movie name>\nExample: .film Deadpool\n\nReply 'done' to stop"),
      ...chamaTheme.getForwardProps()
    }, { quoted: mek });
    return;
  }

  try {
    // Step 1: Check cache for movie data
    const cacheKey = `film_search_${q.toLowerCase()}`;
    let searchData = searchCache.get(cacheKey);

    if (!searchData) {
      const searchUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(q)}`;
      let retries = 3;
      while (retries > 0) {
        try {
          const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
          searchData = searchResponse.data;
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw new Error("Failed to retrieve data from movie treasury");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!searchData.status || !searchData.result.data || searchData.result.data.length === 0) {
        throw new Error("No films found in CHAMA collection");
      }

      searchCache.set(cacheKey, searchData);
    }

    // Step 2: Format movie list
    let filmList = `🎬 *CHAMA MOVIE VAULT* 🎬\n\n`;
    const films = searchData.result.data.map((film, index) => ({
      number: index + 1,
      title: film.title.replace("Sinhala Subtitles | සිංහල උපසිරසි සමඟ", "").trim(),
      link: film.link,
      image: null
    }));

    films.forEach(film => {
      filmList += `${chamaTheme.resultEmojis[0]} ${film.number}. *${film.title}*\n`;
    });
    filmList += `\n${chamaTheme.resultEmojis[8]} Select a movie: Reply with the number\n`;
    filmList += `${chamaTheme.resultEmojis[9]} Reply 'done' to stop`;

    const movieListMessage = await conn.sendMessage(from, {
      text: chamaTheme.box("MOVIE SELECTION", filmList),
      ...chamaTheme.getForwardProps()
    }, { quoted: mek });

    const movieListMessageKey = movieListMessage.key;

    // Step 3: Track download options with a Map
    const downloadOptionsMap = new Map();

    // Step 4: Handle movie and quality selections
    const selectionHandler = async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const replyText = message.message.extendedTextMessage.text.trim();
      const repliedToId = message.message.extendedTextMessage.contextInfo.stanzaId;

      // Exit condition
      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", selectionHandler);
        downloadOptionsMap.clear();
        await conn.sendMessage(from, {
          text: chamaTheme.box("SESSION ENDED", 
            "Movie search session ended!\nUse .film anytime to explore again"),
          ...chamaTheme.getForwardProps()
        }, { quoted: message });
        return;
      }

      // Movie selection
      if (repliedToId === movieListMessageKey.id) {
        const selectedNumber = parseInt(replyText);
        const selectedFilm = films.find(film => film.number === selectedNumber);

        if (!selectedFilm) {
          await conn.sendMessage(from, {
            text: chamaTheme.box("INVALID SELECTION", 
              "Invalid movie number!\nPlease select a valid number from the list"),
            ...chamaTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        // Validate movie link
        if (!selectedFilm.link || !selectedFilm.link.startsWith('http')) {
          await conn.sendMessage(from, {
            text: chamaTheme.box("LINK ERROR", 
              "Invalid movie link detected\nPlease select another movie"),
            ...chamaTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        // Fetch download links and details
        const downloadUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/movie?url=${encodeURIComponent(selectedFilm.link)}`;
        let downloadData;
        let downloadRetries = 3;

        while (downloadRetries > 0) {
          try {
            const downloadResponse = await axios.get(downloadUrl, { timeout: 10000 });
            downloadData = downloadResponse.data;
            if (!downloadData.status || !downloadData.result.data) {
              throw new Error("Invalid API response");
            }
            break;
          } catch (error) {
            downloadRetries--;
            if (downloadRetries === 0) {
              await conn.sendMessage(from, {
                text: chamaTheme.box("FETCH ERROR", 
                  `Failed to fetch download links: ${error.message}\nPlease try another movie`),
                ...chamaTheme.getForwardProps()
              }, { quoted: message });
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const movieDetails = downloadData.result.data;
        const downloadLinks = [];

        // Prioritize pixeldrain_dl links
        const allLinks = movieDetails.pixeldrain_dl || [];
        const sdLink = allLinks.find(link => link.quality === "SD 480p");
        if (sdLink) {
          downloadLinks.push({
            number: 1,
            quality: "SD Quality",
            size: sdLink.size,
            url: sdLink.link
          });
        }

        let hdLink = allLinks.find(link => link.quality === "HD 720p");
        if (!hdLink) {
          hdLink = allLinks.find(link => link.quality === "FHD 1080p");
        }
        if (hdLink) {
          downloadLinks.push({
            number: 2,
            quality: "HD Quality",
            size: hdLink.size,
            url: hdLink.link
          });
        }

        if (downloadLinks.length === 0) {
          await conn.sendMessage(from, {
            text: chamaTheme.box("NO LINKS", 
              "No download links available for this movie\nPlease try another title"),
            ...chamaTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        let downloadOptions = `🎥 *${selectedFilm.title}*\n\n`;
        downloadOptions += `📦 *Available Qualities*\n\n`;
        downloadLinks.forEach(link => {
          downloadOptions += `${chamaTheme.resultEmojis[1]} ${link.number}. *${link.quality}* (${link.size})\n`;
        });
        downloadOptions += `\n${chamaTheme.resultEmojis[8]} Select quality: Reply with number\n`;
        downloadOptions += `${chamaTheme.resultEmojis[9]} Reply 'done' to cancel`;

        const downloadMessage = await conn.sendMessage(from, {
          image: { url: movieDetails.image || "https://i.ibb.co/5Yb4VZy/snowflake.jpg" },
          caption: chamaTheme.box("DOWNLOAD OPTIONS", downloadOptions),
          ...chamaTheme.getForwardProps()
        }, { quoted: message });

        // Store download options in Map
        downloadOptionsMap.set(downloadMessage.key.id, { film: selectedFilm, downloadLinks });
      }
      // Quality selection
      else if (downloadOptionsMap.has(repliedToId)) {
        const { film, downloadLinks } = downloadOptionsMap.get(repliedToId);
        const selectedQualityNumber = parseInt(replyText);
        const selectedLink = downloadLinks.find(link => link.number === selectedQualityNumber);

        if (!selectedLink) {
          await conn.sendMessage(from, {
            text: chamaTheme.box("INVALID QUALITY", 
              "Invalid quality selection!\nPlease choose a valid number"),
            ...chamaTheme.getForwardProps()
          }, { quoted: message });
          return;
        }

        // Send movie as document
        try {
          await conn.sendMessage(from, {
            document: { url: selectedLink.url },
            mimetype: "video/mp4",
            fileName: `${film.title} - ${selectedLink.quality}.mp4`,
            caption: chamaTheme.box("DOWNLOAD COMPLETE", 
              `✅ *${film.title}*\n📦 Quality: ${selectedLink.quality}\n📏 Size: ${selectedLink.size}\n\nEnjoy your movie!`),
            ...chamaTheme.getForwardProps()
          }, { quoted: message });

          await conn.sendMessage(from, { react: { text: "✅", key: message.key } });
        } catch (downloadError) {
          await conn.sendMessage(from, {
            text: chamaTheme.box("DOWNLOAD FAILED", 
              `Error downloading: ${downloadError.message}\nDirect link: ${selectedLink.url}`),
            ...chamaTheme.getForwardProps()
          }, { quoted: message });
        }
      }
    };

    // Register the persistent selection listener
    conn.ev.on("messages.upsert", selectionHandler);

  } catch (e) {
    console.error("Error:", e);
    await conn.sendMessage(from, {
      text: chamaTheme.box("ERROR", 
        `❌ Error: ${e.message || "Service unavailable"}\nPlease try again later`),
      ...chamaTheme.getForwardProps()
    }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});