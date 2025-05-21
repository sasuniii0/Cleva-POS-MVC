import {customer_db,item_db,order_db} from "../db/db.js";
import OrderModel from "../model/orderModel.js";
import OrderDetailsModel from "../model/orderDetails.js";
import { loadItemsOnTable } from "./itemController.js"

let available_items =[];

$(document).ready(function (){
    syncAvailableItems()
    syncCustomers();
    generateNextOrderId();
})

export function syncAvailableItems(){
    available_items =item_db.filter(item => item.quantity >0).map(item =>({
        description: item.description,
        unitPrice : item.unitPrice,
        quantity : item.quantity
    }))
    renderItems();
}
function renderItems(filter = "") {
    const container = $("#order_item_tbody");
    container.empty();

    available_items.filter(item =>
        !filter ||
        (item.description && item.description.toLowerCase().includes(filter.toLowerCase()))
    ).forEach((item, index) => {
        const card = `
    <div class="col-6 col-md-4 mb-3">
        <div class="card h-100 border-0 shadow-sm hover-shadow transition-all">
            <div class="card-body d-flex flex-column">
                <div class="text-start mb-2">
                    <h6 class="card-title mb-1 fw-semibold">${item.description}</h6>
                    <p class="card-text mb-2 text-success fw-bold">Rs. ${item.unitPrice.toFixed(2)}</p>
                    <small class="text-muted">Available: ${item.quantity}</small>
                </div>
                
                <div class="mt-auto">
                    <button class="btn btn-primary btn-sm w-100 add_to_cart_btn" data-index="${index}">
                        <i class="bi bi-cart-plus me-1"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
        container.append(card);
    });
}

$("#search_order_item_input").on("keyup", function () {
    renderItems($(this).val());
});

// Search button
$("#search_order_item_btn").on("click", function (e) {
    e.preventDefault();
    renderItems($("#search_order_item_input").val());
});

let customerList = [];
const dataList_customers = $('#customerDropdown');

export function syncCustomers(){
    customerList = customer_db;
    dataList_customers.empty(); // Clear existing options
    dataList_customers.append('<option value="" disabled selected>Select a customer</option>');

/*
    const datalist_customers = $('#customerDatalist'); // Using jQuery
*/

// Then use it in your $.each
    customerList.forEach(function(customer) {
        let customerOption = `<option value="${customer.name}">${customer.name}</option>`;
        dataList_customers.append(customerOption);
    });

}

$(document).on("click", ".add_to_cart_btn", function () {
    const index = $(this).data("index");
    const item = available_items[index];
    let count = 1;
    let itemTotalAmount = item.unitPrice * count;
    const cartCard = `
                    <div class="col-12 col-md-12 mb-3">
                        <div class="card h-100 bg-light text-dark shadow-sm">
                            <div class="card-body d-flex flex-column justify-content-between">
                                <div class="text-start">
                                    <h6 class="card-title mb-1">${item.description} x <span class="item-cart-count-display">${count}</span></h6>
                                    <p class="card-text mb-2 item-total">Rs. ${item.unitPrice.toFixed(2)} x <span class="item-cart-count-display">${count}</span> = <span class="item-total-amount">${itemTotalAmount.toFixed(2)}</span></p>
                                    <button class="btn btn-dark rounded-circle btn-sm me-1 increaseCount" style="width: 24px; height: 24px; padding: 0; line-height: 1;"><i class="bi bi-plus"></i></button><span class="item-cart-count">${count}</span>
                                    <button class="btn btn-dark rounded-circle btn-sm me-1 decreaseCount" style="width: 24px; height: 24px; padding: 0; line-height: 1;"><i class="bi bi-dash"></i></button> </div>
                                <div class="text-end mt-auto">
                                    <button class="btn btn-transparent text-danger border-0 btn-sm remove_from_cart_btn"><i class="bi bi-trash3-fill fs-5"></i></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    $("#item_cart").append(cartCard);
});

$(document).on('click', ".increaseCount", function () {
    const cardBody = $(this).closest(".card-body");
    const countDisplay = cardBody.find(".item-cart-count-display");
    const countSpans = cardBody.find(".item-cart-count");
    const totalItemAmountText = cardBody.find(".item-total-amount");
    const item = cardBody.find(".card-title").text().split(" x ")[0].trim();
    const price = available_items.find(i => i.description === item).unitPrice;
    const itemData = available_items.find(i => i.description === item);

    let count = parseInt($(countSpans[0]).text());
    count++;

    // Check quantity limit
    if (count > itemData.quantity) {
        Swal.fire({
            title: 'Stock Limit Reached',
            html: `<div class="text-center">
              <i class="bi bi-exclamation-triangle-fill text-warning fs-1 mb-3"></i>
              <p class="mb-0">Only <strong>${itemData.quantity}</strong> ${item}(s) available in stock.</p>
              <p class="text-muted small mt-1">Cannot add more than available quantity.</p>
           </div>`,
            confirmButtonText: 'OK',
        });
        return;
    }

    countSpans.text(count);
    countDisplay.text(count);

    totalItemAmountText.text((price * count).toFixed(2));
});

$(document).on('click', ".decreaseCount", function () {
    const cardBody = $(this).closest(".card-body");
    const countDisplay = cardBody.find(".item-cart-count-display");
    const countSpans = cardBody.find(".item-cart-count");
    const totalItemAmountText = cardBody.find(".item-total-amount");
    const item = cardBody.find(".card-title").text().split(" x ")[0].trim();
    const price = available_items.find(i => i.description === item).unitPrice;
    //const itemData = items.find(i => i.name === item);

    let count = parseInt($(countSpans[0]).text());
    count--;

    // Check quantity limit
    if (count < 1) {
        return;
    }

    countSpans.text(count);
    countDisplay.text(count);

    totalItemAmountText.text((price * count).toFixed(2));
    syncAvailableItems();
});

$(document).on("click", ".remove_from_cart_btn", function () {
    $(this).closest(".col-12").remove();
});

function generateNextOrderId() {
    const nextOrderId = 'OR' + String(order_db.length + 1).padStart(3, '0');
    $('#next_order_id').val(nextOrderId);
}

$(document).on("click", "#finalize-order-place-btn", function (e) {
    e.preventDefault();

    const customerName = $("#customerDropdown").val();
    if (!customerName) {
        Swal.fire({
            icon: 'error',
            title: 'Customer not selected!',
            text: 'Please select a valid customer before placing the order.',
        });
        return;
    }

    const customer = customerList.find(c => c.name === customerName);
    if (!customer) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid customer!',
            text: 'Selected customer does not exist.',
        });
        return;
    }

    const cartItems = $("#item_cart").children(".col-12, .col-md-12");

    if (cartItems.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Cart is empty!',
            text: 'Please add items before placing the order.',
        });
        return;
    }

    // to get order details
    const orderId = $("#next_order_id").val();
    const orderedItems = [];

    cartItems.each(function () {
        const itemName = $(this).find(".card-title").text().split(" x ")[0].trim();
        const itemQuantity = parseInt($(this).find(".item-cart-count").text().trim());
        const itemPrice = Number(available_items.find(i => i.description === itemName).unitPrice);

        /*const item = {name: itemName, quantity: itemQuantity, price: itemPrice};*/
        const orderDetail = new OrderDetailsModel(itemName, itemQuantity, itemPrice);
        orderedItems.push(orderDetail);
        console.log("Item:", orderDetail.name, "Price:", orderDetail.price, "Quantity:", orderDetail.quantity);
        console.log("Raw quantity text:", $(this).find(".item-cart-count").text());

    });

    const order = new OrderModel(orderId, customerName, orderedItems);

    order_db.push(order);

    const totalAmount = orderedItems.reduce((total, item) => total + (Number(item.unitPrice) * Number(item.quantity)), 0);
    console.log("Item Prices:", orderedItems.map(item => item.unitPrice));
    console.log("Calculated Total:", totalAmount);


    // If cart is not empty
    Swal.fire({
        icon: 'success',
        title: 'Order placed!',
        text: 'Your order has been successfully submitted.',
        confirmButtonText: 'OK'
    }).then(() => {
        const order = {
            orderId: $('#next_order_id').val(),
            customer: customer.id,
            available_items: []
        };

        orderedItems.forEach(item => {
            const inventoryItem = item_db.find(i => i.description === item.description);
            if (inventoryItem) {
                if (inventoryItem.qoh - item.quantity < 0) {
                    console.error(`Insufficient stock for ${item.description}.`);
                    return; // Prevent QoH from going negative
                }

                inventoryItem.qoh -= item.quantity; // Reduce stock
                console.log(`Updated QoH for ${item.description}:`, inventoryItem.qoh);

                // Ensure item_db updates correctly
                const itemIndex = item_db.findIndex(i => i.name === item.name);
                if (itemIndex !== -1) {
                    item_db[itemIndex].quantity = inventoryItem.qoh;
                }
            }
        });
        console.log(item_db);
        console.log(available_items);
        syncAvailableItems();
        loadItemsOnTable();

        console.log("updated item db: "+item_db);
        console.log("updated available items: "+available_items);

        $("#item_cart").empty();

        generateNextOrderId();
        $("#customerDropdown").val("");

    });
});


/*
import OrderModel from "../model/orderModel.js";
import ItemModel from "../model/itemModel";
import CustomerModel from "../model/customerModel";
import { order_db, item_db, customer_db } from "../db/db.js";

let cartItems = [];
let selectedCustomer = null;

$(document).ready(function () {
    initializeOrderForm();
    loadProducts();
    loadCustomersDropdown();
    updateCartDisplay();
    updateCustomerDisplay();
});

function initializeOrderForm(){
    $("#order_id").val(generateOrderId());
    $("#order_date").val(getCurrentDate());

    $("#refresh_order_id").on("click", () => {
        $("#order_id").val(generateOrderId());
        const toast = new bootstrap.Toast(document.getElementById('idRefreshToast'));
        toast.show();
    });
}


function generateOrderId() {
    if (order_db.length === 0) return 'ORD-001';

    const lastOrderId = order_db[order_db.length - 1].id;
    const lastIdNum = parseInt(lastOrderId.split('-')[1], 10);
    return `ORD-${String(lastIdNum + 1).padStart(3, '0')}`;
}

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadProducts() {
    $("#item_tbody").empty();

    if (!item_db || item_db.length === 0) {
        $("#item_tbody").append('<div class="col"><p class="text-muted">No products available</p></div>');
        return;
    }

    item_db.forEach(item => {
        const card = `
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4" id="item_tbody">
                        <div class="card" style="width: 18rem;" id="item-card">
                            <div class="card-body">
                                <h5 class="card-title">${item.description}</h5>
                                <p class="card-text">Rs. ${item.unitPrice.toFixed(2)}</p>
                                <p class="card-text">In stock: ${item.quantity}</p>
                                <a href="#" class="btn btn-primary" id="addToCart-btn">Add to cart</a>
                            </div>
                        </div>
                    </div>
        `;
        $("#item_tbody").append(card);
    });
}

function loadCustomersDropdown() {
    const dropdownMenu = $("#customerDropdownMenu");
    dropdownMenu.empty();

    if (!customer_db || customer_db.length === 0) {
        dropdownMenu.append('<li><a class="dropdown-item disabled">No customers found</a></li>');
        return;
    }

    customer_db.forEach(customer => {
        const item = $(`<li><a class="dropdown-item customer-select" href="#" data-id="${customer.id}">${customer.firstName}</a></li>`);
        dropdownMenu.append(item);
    });
}


$(document).on("click", ".customer-select", function (e) {
    e.preventDefault();
    const customerId = $(this).data("id");
    const customer = customer_db.find(c => c.id === customerId);
    if (customer) {
        $("#customerDropdown").text(customer.name);
        $("#customer-details").html(`
            <p><strong>ID:</strong> ${customer.id}</p>
            <p><strong>Address:</strong> ${customer.address}</p>
        `);
    }
});

function updateCustomerDisplay() {
    const customerDetails = $("#customer-details");
    customerDetails.empty();

    if (!selectedCustomer) {
        customerDetails.append('<p class="text-muted">Please select a customer</p>');
        return;
    }

    customerDetails.append(`
        <div class="card cart-item">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <h5 class="card-title">${selectedCustomer.name}</h5>
                </div>
                <p class="card-text">Email: ${selectedCustomer.email}</p>
                <p class="card-text">Address: ${selectedCustomer.address}</p>
                <p class="card-text">Contact: ${selectedCustomer.contact}</p>
            </div>
        </div>
    `);
}

$(document).on("click", "#addToCart-btn", function () {
    const itemId = parseInt($(this).data("id"));
    const item = item_db.find(i => i.id === itemId);

    if (!item) return;

    const existingItem = cartItems.find(ci => ci.item.id === itemId);

    if (existingItem) {
        if (existingItem.quantity >= item.quantity) {
            Swal.fire("Out of Stock", `Only ${item.quantity} available`, "error");
            return;
        }
        existingItem.quantity++;
    } else {
        cartItems.push({ item, quantity: 1 });
    }

    updateCartDisplay();
    showCartNotification(item.description);
});

function updateCartDisplay() {
    const cart = $("#item_cart");
    cart.empty();

    if (cartItems.length === 0) {
        cart.append('<p class="text-muted">Your cart is empty</p>');
        $(".total-display").hide();
        return;
    }

    $(".total-display").show();
    let total = 0;

    cartItems.forEach(ci => {
        const itemTotal = ci.item.unitPrice * ci.quantity;
        total += itemTotal;

        cart.append(`
            <div class="card mb-2 cart-item" data-id="${ci.item.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h5 class="card-title">${ci.item.description}</h5>
                        <button class="btn btn-sm btn-outline-danger remove-item">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <p class="card-text">Rs. ${ci.item.unitPrice.toFixed(2)} x ${ci.quantity} = Rs. ${itemTotal.toFixed(2)}</p>
                    <div class="quantity-control">
                        <button class="btn btn-sm btn-outline-secondary decrease-qty">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="quantity-display">${ci.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary increase-qty">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `);
    });

    $(".total-display span:last").text(`Rs. ${total.toFixed(2)}`);
}

$(document).on("click", ".increase-qty", function () {
    const itemId = parseInt($(this).closest(".cart-item").data("id"));
    const cartItem = cartItems.find(ci => ci.item.id === itemId);
    const stockItem = item_db.find(i => i.id === itemId);

    if (cartItem.quantity >= stockItem.quantity) {
        Swal.fire("Out of Stock", `Only ${stockItem.quantity} available`, "error");
        return;
    }

    cartItem.quantity++;
    updateCartDisplay();
});

$(document).on("click", ".decrease-qty", function () {
    const itemId = parseInt($(this).closest(".cart-item").data("id"));
    const cartIndex = cartItems.findIndex(ci => ci.item.id === itemId);

    if (cartIndex !== -1) {
        cartItems[cartIndex].quantity--;
        if (cartItems[cartIndex].quantity <= 0) {
            cartItems.splice(cartIndex, 1);
        }
    }

    updateCartDisplay();
});

$(document).on("click", ".remove-item", function () {
    const itemId = parseInt($(this).closest(".cart-item").data("id"));
    cartItems = cartItems.filter(ci => ci.item.id !== itemId);
    updateCartDisplay();
});

$(document).on("click", "#continue", function (e) {
    e.preventDefault();

    if (!selectedCustomer) {
        Swal.fire("Error", "Please select a customer first", "error");
        return;
    }

    if (cartItems.length === 0) {
        Swal.fire("Error", "Your cart is empty", "error");
        return;
    }

    const orderItems = cartItems.map(ci => ({
        id: ci.item.id,
        name: ci.item.description,
        price: ci.item.unitPrice,
        quantity: ci.quantity,
        total: ci.item.unitPrice * ci.quantity
    }));

    const total = orderItems.reduce((sum, item) => sum + item.total, 0);

    Swal.fire({
        title: "Confirm Order",
        html: `
            <p>Customer: <strong>${selectedCustomer.name}</strong></p>
            <p>Total Items: <strong>${orderItems.reduce((sum, item) => sum + item.quantity, 0)}</strong></p>
            <p>Total Price: <strong>Rs. ${total.toFixed(2)}</strong></p>
            <p>Place this order?</p>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Place Order",
    }).then(result => {
        if (result.isConfirmed) {
            // Deduct quantities from inventory
            cartItems.forEach(ci => {
                const stockItem = item_db.find(i => i.id === ci.item.id);
                stockItem.quantity -= ci.quantity;
            });

            const order = new OrderModel(
                $("#order_id").val(),
                selectedCustomer.id,
                selectedCustomer.name,
                orderItems,
                total,
                $("#order_date").val()
            );

            $("#total").append(`
                    <div class="total-display d-flex justify-content-between" id="total">
                            <span>Total: ${total}</span>
                         
                        </div>
            `)

            order_db.push(order);

            resetCart();
            loadProducts();

            Swal.fire("Success", "Order placed successfully", "success").then(() => {
                // Generate new order ID for next order
                $("#order_id").val(generateOrderId());
            });
        }
    });
});

function resetCart() {
    cartItems = [];
    updateCartDisplay();
}

function showCartNotification(itemName) {
    const toast = new bootstrap.Toast(document.getElementById('idRefreshToast'));
    document.querySelector(".toast-body").textContent = `${itemName} added to cart`;
    toast.show();
}*/
