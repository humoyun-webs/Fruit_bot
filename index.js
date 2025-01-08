require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cart = require('./cart');
const customerService = require('./customerService');
const products = require('./products.json');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Start Command with Persistent Menu
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
        `👋 Welcome to **ShopEase Bot**!\n\n🛍️ *Explore our e-commerce features:*\n- Browse products\n- View your cart\n- Checkout\n\n💬 *Need help?*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    ['🛍️ Browse Products', '🛒 View Cart', 'Checkout'],
                    ['💬 Contact Support', '📄 FAQs']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        }
    );
});

// Browse Products
const handleBrowse = (chatId) => {
    products.forEach((product, index) => {
        const productDetails = `
📦 *${product.name}*
💲 Price: $${product.price}
📃 ${product.description}`;

        bot.sendPhoto(chatId, product.image, {
            caption: productDetails,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➕ Add to Cart', callback_data: `add_${index}` }]
                ]
            }
        });
    });
};

bot.on('message', (msg) => {
    if (msg.text === '🛍️ Browse Products') {
        handleBrowse(msg.chat.id);
    }
});

// Add to Cart
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('add_')) {
        const index = parseInt(data.split('_')[1]);
        const product = products[index];
        cart.addToCart(chatId, product);
        bot.answerCallbackQuery(query.id, { text: `✅ ${product.name} added to cart!` });
    }
});

// View Cart
const handleCart = (chatId) => {
    const items = cart.getCart(chatId);

    if (items.length === 0) {
        bot.sendMessage(chatId, '🛒 Your cart is empty! Use "🛍️ Browse Products" to add items.');
        return;
    }

    let cartSummary = '*🛒 Your Cart:*\n\n';
    items.forEach((item, index) => {
        cartSummary += `🔹 ${index + 1}. *${item.name}* - $${item.price}\n`;
    });

    cartSummary += `\n💲 *Total:* $${items.reduce((sum, item) => sum + item.price, 0)}\n\n✅ Use "Checkout" to complete your purchase.`;
    bot.sendMessage(chatId, cartSummary, { parse_mode: 'Markdown' });
};

bot.on('message', (msg) => {
    if (msg.text === '🛒 View Cart') {
        handleCart(msg.chat.id);
    }
});

// Checkout
bot.on('message', (msg) => {
    if (msg.text === 'Checkout') {
        const chatId = msg.chat.id;
        const items = cart.getCart(chatId);

        if (items.length === 0) {
            bot.sendMessage(chatId, '🛒 Your cart is empty. Use "🛍️ Browse Products" to shop.');
            return;
        }

        const total = items.reduce((sum, item) => sum + item.price, 0);
        cart.clearCart(chatId);

        bot.sendMessage(chatId, `🎉 *Thank you for your purchase!*\n\n💲 *Total Paid:* $${total}\n🛍️ Your order will be processed shortly.`, { parse_mode: 'Markdown' });
    }
});

// Help (FAQs)
bot.on('message', (msg) => {
    if (msg.text === '📄 FAQs') {
        const faq = customerService.getFAQ();
        bot.sendMessage(msg.chat.id, `💬 *Frequently Asked Questions:*\n\n${faq}\n\n💡 Use "💬 Contact Support" for further assistance.`, { parse_mode: 'Markdown' });
    }
});

// Contact Support
bot.on('message', (msg) => {
    if (msg.text === '💬 Contact Support') {
        bot.sendMessage(msg.chat.id, '💬 Please type your query. Our support team will respond shortly.');
    }
});
