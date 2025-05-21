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
    dataList_customers.empty();
    dataList_customers.append('<option value="" disabled selected>Select a customer</option>');

/*
    const datalist_customers = $('#customerDatalist'); // Using jQuery
*/

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

    const orderId = $("#next_order_id").val();
    const orderedItems = [];

    cartItems.each(function () {
        const itemName = $(this).find(".card-title").text().split(" x ")[0].trim();
        const itemQuantity = parseInt($(this).find(".item-cart-count").text().trim());
        const itemPrice = Number(available_items.find(i => i.description === itemName).unitPrice);

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
                    return;
                }

                inventoryItem.qoh -= item.quantity;
                console.log(`Updated QoH for ${item.description}:`, inventoryItem.qoh);

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