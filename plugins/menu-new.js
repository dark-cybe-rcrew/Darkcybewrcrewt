const fs = require('fs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');

cmd({
    pattern: "menu",
    desc: "Show interactive menu system",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Count total commands
        const totalCommands = Object.keys(commands).length;
        
        const menuCaption = `╭━━━〔 *${config.BOT_NAME}* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👑 Owner : *🅳🅲🅲 𝚃𝙼*
┃★│ 🤖 Baileys : *Multi Device*
┃★│ 💻 Type : *NodeJs*
┃★│ 🚀 Platform : *Heroku*
┃★│ ⚙️ Mode : *[${config.MODE}]*
┃★│ 🔣 Prefix : *[${config.PREFIX}]*
┃★│ 🏷️ Version : *5.0.0 Bᴇᴛᴀ*
┃★│ 📚 Commands : *${totalCommands}*
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
╭━━〔 *Menu List* 〕━━┈⊷
┃◈╭─────────────·๏
┃◈│1️⃣  📥 *Download Menu*
┃◈╰───────────┈⊷
╰──────────────┈⊷
> 🇱🇰▸⊑͎␟𝐃▲ʀ͟͞ᴋ𔕊ᴄ͟͞ʏ͟͞ʙ͟͞ᴇ͟͞ʀ𔕊ᴄ͟͞ʀ͟͞ᴇ͟͞ᴡ␟⊒͎🇱🇰`;

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363419192353625@newsletter',
                newsletterName: '🇱🇰▸⊑͎␟𝐃▲ʀ͟͞ᴋ𔕊ᴄ͟͞ʏ͟͞ʙ͟͞ᴇ͟͞ʀ𔕊ᴄ͟͞ʀ͟͞ᴇ͟͞ᴡ␟⊒͎🇱🇰',
                serverMessageId: 143
            }
        };

        // Function to send menu image with timeout
        const sendMenuImage = async () => {
            try {
                return await conn.sendMessage(
                    from,
                    {
                        image: { url: || 'https://files.catbox.moe/5wr7e6.jpg },
                        caption: menuCaption,
                        contextInfo: contextInfo
                    },
                    { quoted: mek }
                );
            } catch (e) {
                console.log('Image send failed, falling back to text');
                return await conn.sendMessage(
                    from,
                    { text: menuCaption, contextInfo: contextInfo },
                    { quoted: mek }
                );
            }
        };

        // Send image with timeout
        let sentMsg;
        try {
            sentMsg = await Promise.race([
                sendMenuImage(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Image send timeout')), 10000))
            ]);
        } catch (e) {
            console.log('Menu send error:', e);
            sentMsg = await conn.sendMessage(
                from,
                { text: menuCaption, contextInfo: contextInfo },
                { quoted: mek }
            );
        }
        
        const messageID = sentMsg.key.id;

        // Menu data (complete version)
        const menuData = {
            '1': {
                title: "📥 *Download Menu* 📥",
                content: `╭━━━〔 *Download Menu* 〕━━
┃★╭──────────────
┃★│ 🌐 *Social Media*
┃★│ • song
┃★│ • song2
┃★│ • video
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
> © ᴘᴏᴡᴇʀᴇᴅ 𝙱𝚈 🇱🇰▸⊑͎␟𝐃▲ʀ͟͞ᴋ𔕊ᴄ͟͞ʏ͟͞ʙ͟͞ᴇ͟͞ʀ𔕊ᴄ͟͞ʀ͟͞ᴇ͟͞ᴡ␟⊒͎🇱🇰
`,
                image: true
            }
        };

        // Message handler with improved error handling
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (isReplyToMenu) {
                    const receivedText = receivedMsg.message.conversation || 
                                      receivedMsg.message.extendedTextMessage?.text;
                    const senderID = receivedMsg.key.remoteJid;

                    if (menuData[receivedText]) {
                        const selectedMenu = menuData[receivedText];
                        
                        try {
                            if (selectedMenu.image) {
                                await conn.sendMessage(
                                    senderID,
                                    {
                                        image: { url: || 'https://files.catbox.moe/5wr7e6.jpg' },
                                        caption: selectedMenu.content,
                                        contextInfo: contextInfo
                                    },
                                    { quoted: receivedMsg }
                                );
                            } else {
                                await conn.sendMessage(
                                    senderID,
                                    { text: selectedMenu.content, contextInfo: contextInfo },
                                    { quoted: receivedMsg }
                                );
                            }

                            await conn.sendMessage(senderID, {
                                react: { text: '✅', key: receivedMsg.key }
                            });

                        } catch (e) {
                            console.log('Menu reply error:', e);
                            await conn.sendMessage(
                                senderID,
                                { text: selectedMenu.content, contextInfo: contextInfo },
                                { quoted: receivedMsg }
                            );
                        }

                    } else {
                        await conn.sendMessage(
                            senderID,
                            {
                                text: `❌ *Invalid Option!* \n\n*Example:* Reply with "1" for Download Menu\n\n> 🇱🇰▸⊑͎␟𝐃▲ʀ͟͞ᴋ𔕊ᴄ͟͞ʏ͟͞ʙ͟͞ᴇ͟͞ʀ𔕊ᴄ͟͞ʀ͟͞ᴇ͟͞ᴡ␟⊒͎🇱🇰`,
                                contextInfo: contextInfo
                            },
                            { quoted: receivedMsg }
                        );
                    }
                }
            } catch (e) {
                console.log('Handler error:', e);
            }
        };

        // Add listener
        conn.ev.on("messages.upsert", handler);

        // Remove listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    } catch (e) {
        console.error('Menu Error:', e);
        try {
            await conn.sendMessage(
                from,
                { text: `❌ Menu system is currently busy. Please try again later.\n\n> 🇱🇰▸⊑͎␟𝐃▲ʀ͟͞ᴋ𔕊ᴄ͟͞ʏ͟͞ʙ͟͞ᴇ͟͞ʀ𔕊ᴄ͟͞ʀ͟͞ᴇ͟͞ᴡ␟⊒͎🇱🇰` },
                { quoted: mek }
            );
        } catch (finalError) {
            console.log('Final error handling failed:', finalError);
        }
    }
});
