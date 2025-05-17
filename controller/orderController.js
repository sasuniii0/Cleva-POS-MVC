import OrderModel from "../model/orderModel.js";
import { order_db } from "../db/db.js";

let cartItems = [];
let items = [
    {
        id: 1,
        desc: "Cetaphil",
        price: 20000.00,
        stock: 200,
        picture: "../assets/photos/pic1.jpeg"
    },
    {
        id: 2,
        desc: "Dove",
        price: 30000.00,
        stock: 100,
        picture: "../assets/photos/pic2.jpeg"
    },
    {
        id: 3,
        desc: "Lux",
        price: 15000.00,
        stock: 50,
        picture: "../assets/photos/pic3.jpeg"
    },
    {
        id: 4,
        desc: "Nivea",
        price: 50000.00,
        stock: 20,
        picture: "../assets/photos/pic4.jpeg"
    },
    {
        id: 5,
        desc: "Pond's",
        price: 25000.00,
        stock: 10,
        picture: "../assets/photos/pic5.jpeg"
    },
    {
        id: 6,
        desc: "Vaseline",
        price: 18000.00,
        stock: 5,
        picture: "../assets/photos/pic6.jpeg"
    }
];

const customers = [
    { name: "John" },
    { name: "Ann" },
    { name: "Sasuni" },
    { name: "Minuki" },
    { name: "Chanuli" }
];

$(document).ready(function() {
    getItems();
    initCustomers();
    updateCartDisplay();
});

function getItems(filter = "") {
    const container = $("#item_tbody");
    container.empty();

    const filteredItems = items.filter(item =>
        item.desc.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredItems.length === 0) {
        container.append('<p class="text-muted">No items found</p>');
        return;
    }

    filteredItems.forEach((item, index) => {
        const card = `
            <div class="card mb-3" style="width: 18rem;">
                <img src="${item.picture}" class="card-img-top" alt="${item.desc}" height="330px">
                <div class="card-body">
                    <h5 class="card-title">${item.desc}</h5>
                    <p class="card-text">Rs. ${item.price.toFixed(2)}</p>
                    <p class="text-muted">In stock: ${item.stock}</p>
                    <button class="btn btn-primary add-to-cart" data-id="${item.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        container.append(card);
    });
}

function initCustomers() {
    const customersList = $("#customerDatalistOptions");
    customersList.empty();
    customers.forEach(customer => {
        customersList.append(`<option value="${customer.name}">`);
    });
}

$(document).on("click", ".add-to-cart", function() {
    const itemId = parseInt($(this).data("id"));
    const item = items.find(i => i.id === itemId);

    if (!item) {
        console.error("Item not found with ID:", itemId);
        return;
    }

    const existingItem = cartItems.find(ci => ci.item.id === itemId);

    if (existingItem) {
        if (existingItem.quantity >= item.stock) {
            Swal.fire({
                icon: 'error',
                title: 'Out of Stock',
                text: `Only ${item.stock} ${item.desc} available`
            });
            return;
        }
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            item: item,
            quantity: 1
        });
    }
    updateCartDisplay();
    showCartNotification(item.desc);
});

function updateCartDisplay() {
    const cartContainer = $("#item_cart");
    cartContainer.empty();

    if (cartItems.length === 0) {
        cartContainer.append('<p class="text-muted">Your cart is empty</p>');
        return;
    }

    let total = 0;

    cartItems.forEach((cartItem, index) => {
        const item = cartItem.item;
        const quantity = cartItem.quantity;
        const itemTotal = item.price * quantity;
        total += itemTotal;

        const cartItemHtml = `
        <div class="card mb-3 cart-item" data-id="${item.id}">
            <div class="row g-0">
                <div class="col-md-3">
                    <img src="${item.picture}" class="img-fluid rounded-start" alt="${item.desc}">
                </div>
                <div class="col-md-9">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title">${item.desc}</h5>
                            <button class="btn btn-sm btn-outline-danger remove-item">
                                &times;
                            </button>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="quantity-controls d-flex align-items-center">
                                <button class="btn btn-sm btn-outline-secondary decrease-quantity">
                                    <img src="../assets/icon/minus.png" width="16" height="16" alt="Decrease">
                                </button>
                                <span class="mx-2 quantity">${quantity}</span>
                                <button class="btn btn-sm btn-outline-secondary increase-quantity">
                                    <img src="../assets/icon/plus.png" width="16" height="16" alt="Increase">
                                </button>
                            </div>
                            <div>
                                <span class="fw-bold">Rs. ${itemTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        cartContainer.append(cartItemHtml);
    });

    cartContainer.append(`
        <div class="d-flex justify-content-between align-items-center mt-3 p-3 bg-light rounded">
            <h5 class="mb-0">Total:</h5>
            <h5 class="mb-0">Rs. ${total.toFixed(2)}</h5>
        </div>
    `);
}

$(document).on('click', '.increase-quantity', function() {
    const card = $(this).closest('.cart-item');
    const itemId = parseInt(card.data('id'));
    const cartItem = cartItems.find(ci => ci.item.id === itemId);

    if (!cartItem) return;

    // Check stock
    const item = items.find(i => i.id === itemId);
    if (cartItem.quantity >= item.stock) {
        Swal.fire({
            icon: 'error',
            title: 'Out of Stock',
            text: `Only ${item.stock} ${item.desc} available`
        });
        return;
    }

    cartItem.quantity += 1;
    updateCartDisplay();
});

$(document).on('click', '.decrease-quantity', function() {
    const card = $(this).closest('.cart-item');
    const itemId = parseInt(card.data('id'));
    const cartItemIndex = cartItems.findIndex(ci => ci.item.id === itemId);

    if (cartItemIndex === -1) return;

    cartItems[cartItemIndex].quantity -= 1;

    if (cartItems[cartItemIndex].quantity < 1) {
        cartItems.splice(cartItemIndex, 1);
    }

    updateCartDisplay();
});

$(document).on('click', '.remove-item', function() {
    const card = $(this).closest('.cart-item');
    const itemId = parseInt(card.data('id'));
    cartItems = cartItems.filter(ci => ci.item.id !== itemId);
    updateCartDisplay();
});

$(document).on("click", "#continue", function(e) {
    e.preventDefault();
    const customerName = $("#search_customer_input").val().trim();

    if (!customerName || !customers.some(c => c.name === customerName)) {
        Swal.fire('Error', 'Please select a valid customer', 'error');
        return;
    }

    if (cartItems.length === 0) {
        Swal.fire('Error', 'Please add items to your cart', 'error');
        return;
    }

    const orderItems = cartItems.map(cartItem => ({
        id: cartItem.item.id,
        name: cartItem.item.desc,
        price: cartItem.item.price,
        quantity: cartItem.quantity,
        total: cartItem.item.price * cartItem.quantity
    }));

    const total = orderItems.reduce((sum, item) => sum + item.total, 0);

    Swal.fire({
        title: 'Confirm Order',
        html: `
            <p>Customer: <strong>${customerName}</strong></p>
            <p>Items: <strong>${orderItems.reduce((sum, item) => sum + item.quantity, 0)}</strong></p>
            <p>Total: <strong>Rs. ${total.toFixed(2)}</strong></p>
            <p>Are you sure you want to place this order?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Place Order'
    }).then((result) => {
        if (result.isConfirmed) {
            cartItems.forEach(cartItem => {
                const item = items.find(i => i.id === cartItem.item.id);
                if (item) {
                    item.stock -= cartItem.quantity;
                }
            });

            const order = new OrderModel(customerName, orderItems);
            order_db.push(order);

            resetCart();
            getItems();

            Swal.fire(
                'Order Placed!',
                'Your order has been successfully placed.',
                'success'
            );
        }
    });
});

function resetCart() {
    cartItems = [];
    updateCartDisplay();
}

function showCartNotification(itemName) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });

    Toast.fire({
        icon: 'success',
        title: `${itemName} added to cart`
    });
}