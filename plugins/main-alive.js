const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["status", "online", "a"],
    desc: "Check bot is alive or not",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const status = `
╭───〔 *🤖 🅳🅲🅲 🅼🅳 STATUS* 〕───◉
│✨ *Bot is Active & Online!*
│
│🧠 *Owner:* 🅳🅲🅲 𝚃𝙼
│⚡ *Version:* 4.0.0
│📝 *Prefix:* [${config.PREFIX}]
│📳 *Mode:* [${config.MODE}]
│💾 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB
│🖥️ *Host:* ${os.hostname()}
│⌛ *Uptime:* ${runtime(process.uptime())}
╰────────────────────◉
> 🇱🇰▸⊑͎␟𝐃▲ʀ͟͞ᴋ𔕊ᴄ͟͞ʏ͟͞ʙ͟͞ᴇ͟͞ʀ𔕊ᴄ͟͞ʀ͟͞ᴇ͟͞ᴡ␟⊒͎🇱🇰`;

        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/5wr7e6.jpg' },
            caption: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363419192353625@newsletter',
                    newsletterName: '🇱🇰▸⊑͎␟𝐃▲ʀ͟͞ᴋ𔕊ᴄ͟͞ʏ͟͞ʙ͟͞ᴇ͟͞ʀ𔕊ᴄ͟͞ʀ͟͞ᴇ͟͞ᴡ␟⊒͎🇱🇰',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
