const carts = {};

const addToCart = (userId, product) => {
    if (!carts[userId]) {
        carts[userId] = [];
    }
    carts[userId].push(product);
};

const getCart = (userId) => {
    return carts[userId] || [];
};

const clearCart = (userId) => {
    delete carts[userId];
};

module.exports = { addToCart, getCart, clearCart };
