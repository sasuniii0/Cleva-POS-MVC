/*
/!*import OrderModel from "../model/orderModel.js";
import { order_db, item_db, customer_db } from "../db/db.js";*!/

export default class OrderController {
    constructor() {
        this.cartItems = [];
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.loadProducts();
        this.initCustomers();
        this.updateCartDisplay();
        this.setCurrentDate();
        this.generateOrderId();
    }

    setupEventListeners() {
        // Product search
        $('#productSearch').on('input', () => this.loadProducts($('#productSearch').val()));
        $('#search_item_btn').on('click', () => this.loadProducts($('#productSearch').val()));

        // Customer search
        $('#search_customer_input').on('input', () => this.searchCustomer($('#search_customer_input').val()));
        $('#search_customer_btn').on('click', () => this.searchCustomer($('#search_customer_input').val()));

        // Order ID refresh
        $('#refresh_order_id').on('click', () => {
            this.generateOrderId();
            this.showToast('New Order ID Generated', 'success');
        });

        // Discount controls
        $('#discount-plus').on('click', () => this.adjustDiscount(5));
        $('#discount-minus').on('click', () => this.adjustDiscount(-5));
        $('#discount').on('input', () => this.updateCartDisplay());

        // Order search
        $('#search_order_btn').on('click', () => this.searchOrder());

        // Place order
        $('#continue').on('click', (e) => {
            e.preventDefault();
            this.placeOrder();
        });
    }

    setCurrentDate() {
        const now = new Date();
        $('#order_date').val(now.toISOString().split('T')[0]);
    }

    generateOrderId() {
        const lastId = order_db.reduce((max, order) => Math.max(max, order.id), 0);
        const newId = lastId + 1;
        $('#order_id').val(`ORD-${newId.toString().padStart(4, '0')}`);
        return newId;
    }

    loadProducts(filter = "") {
        try {
            const container = $("#item_tbody");
            container.empty();

            const filteredItems = item_db.filter(item =>
                item && item.description &&
                item.description.toLowerCase().includes(filter.toLowerCase())
            );

            if (filteredItems.length === 0) {
                container.append('<div class="col-12 text-center text-muted py-4">No products found</div>');
                return;
            }

            filteredItems.forEach(item => {
                const card = `
                    <div class="col">
                        <div class="card product-card h-100">
                            <img src="${item.picture || 'images/placeholder.jpg'}" 
                                 class="card-img-top product-img" 
                                 alt="${item.description}" 
                                 style="height: 180px; object-fit: cover;"
                                 onerror="this.src='images/placeholder.jpg'">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${item.description}</h5>
                                <p class="card-text">Rs. ${item.price?.toFixed(2) || '0.00'}</p>
                                <p class="text-muted">In stock: ${item.stock || 0}</p>
                                <button class="btn btn-primary mt-auto add-to-cart" data-id="${item.id}">
                                    <i class="bi bi-cart-plus"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.append(card);
            });

            $('.add-to-cart').off('click').on('click', (e) => {
                const itemId = parseInt($(e.currentTarget).data('id'));
                this.addToCart(itemId);
            });

        } catch (error) {
            console.error("Error loading products:", error);
            $("#item_tbody").html('<div class="col-12 text-danger">Error loading products</div>');
        }
    }

    initCustomers() {
        const customersList = $("#customerDatalistOptions");
        customersList.empty();

        customer_db.forEach(customer => {
            if (customer && customer.name) {
                customersList.append(`<option value="${customer.name}">`);
            }
        });
    }

    searchCustomer(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            $('#customer_details').html('<p class="text-muted">Enter customer name</p>');
            return;
        }

        const customer = customer_db.find(c =>
            c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (customer) {
            $('#customer_details').html(`
                <p><strong>Name:</strong> ${customer.name}</p>
                <p><strong>Contact:</strong> ${customer.contactNumber}</p>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Balance:</strong> Rs. ${customer.balance?.toFixed(2) || '0.00'}</p>
            `);
        } else {
            $('#customer_details').html('<p class="text-muted">No customer found</p>');
        }
    }

    addToCart(itemId) {
        const item = item_db.find(i => i.id === itemId);
        if (!item) {
            this.showAlert('Error', 'Product not found', 'error');
            return;
        }

        const existingItem = this.cartItems.find(ci => ci.item.id === itemId);

        if (existingItem) {
            if (existingItem.quantity >= item.stock) {
                this.showAlert('Out of Stock', `Only ${item.stock} ${item.description} available`, 'error');
                return;
            }
            existingItem.quantity += 1;
        } else {
            this.cartItems.push({
                item: item,
                quantity: 1
            });
        }

        this.updateCartDisplay();
        this.showToast(`${item.description} added to cart`, 'success');
    }

    updateCartDisplay() {
        const cartContainer = $("#item_cart");
        const emptyCartMsg = $("#empty-cart-message");
        cartContainer.empty();

        if (this.cartItems.length === 0) {
            emptyCartMsg.show();
            $('#total_amount').text('Rs. 0.00');
            $('#discounted_total').text('Rs. 0.00');
            $('#balance').text('Rs. 0.00');
            return;
        }

        emptyCartMsg.hide();

        let subtotal = 0;
        const discount = parseFloat($('#discount').val()) || 0;
        const customerName = $('#search_customer_input').val().trim();
        const customer = customer_db.find(c => c.name === customerName);
        const customerBalance = customer ? customer.balance : 0;

        this.cartItems.forEach(cartItem => {
            const item = cartItem.item;
            const quantity = cartItem.quantity;
            const itemTotal = item.price * quantity;
            subtotal += itemTotal;

            const cartItemHtml = `
            <div class="card mb-3 cart-item" data-id="${item.id}">
                <div class="row g-0">
                    <div class="col-md-3">
                        <img src="${item.picture}" class="img-fluid rounded-start" alt="${item.description}">
                    </div>
                    <div class="col-md-9">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h5 class="card-title">${item.description}</h5>
                                <button class="btn btn-sm btn-outline-danger remove-item">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div class="quantity-controls d-flex align-items-center">
                                    <button class="btn btn-sm btn-outline-secondary decrease-quantity">
                                        <i class="bi bi-dash"></i>
                                    </button>
                                    <span class="mx-2 quantity">${quantity}</span>
                                    <button class="btn btn-sm btn-outline-secondary increase-quantity">
                                        <i class="bi bi-plus"></i>
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

        $('.increase-quantity').off('click').on('click', (e) => {
            const itemId = parseInt($(e.currentTarget).closest('.cart-item').data('id'));
            this.adjustQuantity(itemId, 1);
        });

        $('.decrease-quantity').off('click').on('click', (e) => {
            const itemId = parseInt($(e.currentTarget).closest('.cart-item').data('id'));
            this.adjustQuantity(itemId, -1);
        });

        $('.remove-item').off('click').on('click', (e) => {
            const itemId = parseInt($(e.currentTarget).closest('.cart-item').data('id'));
            this.removeFromCart(itemId);
        });

        const discountedTotal = subtotal - (subtotal * (discount / 100));
        const newBalance = customerBalance - discountedTotal;

        $('#total_amount').text(`Rs. ${subtotal.toFixed(2)}`);
        $('#discounted_total').text(`Rs. ${discountedTotal.toFixed(2)}`);
        $('#balance').text(`Rs. ${newBalance.toFixed(2)}`);
    }

    adjustQuantity(itemId, change) {
        const cartItemIndex = this.cartItems.findIndex(ci => ci.item.id === itemId);
        if (cartItemIndex === -1) return;

        const cartItem = this.cartItems[cartItemIndex];
        const item = item_db.find(i => i.id === itemId);

        if (change > 0) {
            if (cartItem.quantity >= item.stock) {
                this.showAlert('Out of Stock', `Only ${item.stock} ${item.description} available`, 'error');
                return;
            }
            cartItem.quantity += change;
        } else {
            cartItem.quantity += change;
            if (cartItem.quantity < 1) {
                this.cartItems.splice(cartItemIndex, 1);
            }
        }

        this.updateCartDisplay();
    }

    removeFromCart(itemId) {
        this.cartItems = this.cartItems.filter(ci => ci.item.id !== itemId);
        this.updateCartDisplay();
    }

    adjustDiscount(change) {
        const input = $('#discount');
        let value = parseInt(input.val()) || 0;
        value = Math.max(0, Math.min(value + change, 100));
        input.val(value).trigger('input');

        if (value > 0) {
            input.addClass('is-valid');
            $('#discount-badge').removeClass('d-none').text(`-${value}%`);
        } else {
            input.removeClass('is-valid');
            $('#discount-badge').addClass('d-none');
        }
    }

    searchOrder() {
        const orderId = parseInt($('#search_order_input').val());
        if (isNaN(orderId)) {
            this.showAlert('Error', 'Please enter a valid order ID', 'error');
            return;
        }

        const order = order_db.find(o => o.id === orderId);
        if (order) {
            Swal.fire({
                title: `Order #${order.id}`,
                html: `
                    <p><strong>Date:</strong> ${order.date}</p>
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Items:</strong> ${order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                    <p><strong>Subtotal:</strong> Rs. ${order.total?.toFixed(2) || '0.00'}</p>
                    <p><strong>Total:</strong> Rs. ${order.total?.toFixed(2) || '0.00'}</p>
                `,
                icon: 'info',
                confirmButtonText: 'OK'
            });
        } else {
            this.showAlert('Error', `Order #${orderId} not found`, 'error');
        }
    }

    async placeOrder() {
        try {
            const customerName = $("#search_customer_input").val().trim();
            const discount = parseFloat($('#discount').val()) || 0;

            // Validate inputs
            if (!customerName || !customer_db.some(c => c.name === customerName)) {
                this.showAlert('Error', 'Please select a valid customer', 'error');
                return;
            }

            if (this.cartItems.length === 0) {
                this.showAlert('Error', 'Please add items to your cart', 'error');
                return;
            }

            // Check stock
            const outOfStockItems = this.cartItems.filter(cartItem => {
                const item = item_db.find(i => i.id === cartItem.item.id);
                return item.stock < cartItem.quantity;
            });

            if (outOfStockItems.length > 0) {
                const itemNames = outOfStockItems.map(i => i.item.description).join(', ');
                this.showAlert('Out of Stock', `Not enough stock for: ${itemNames}`, 'error');
                return;
            }

            // Prepare order data
            const orderItems = this.cartItems.map(cartItem => ({
                id: cartItem.item.id,
                name: cartItem.item.description,
                price: cartItem.item.price,
                quantity: cartItem.quantity,
                total: cartItem.item.price * cartItem.quantity
            }));

            const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
            const total = subtotal - (subtotal * (discount / 100));

            // Check customer balance
            const customer = customer_db.find(c => c.name === customerName);
            if (customer.balance < total) {
                this.showAlert('Insufficient Balance',
                    `Customer balance is insufficient (Rs. ${customer.balance.toFixed(2)} available, Rs. ${total.toFixed(2)} needed)`,
                    'error');
                return;
            }

            // Confirm order
            const { isConfirmed } = await Swal.fire({
                title: 'Confirm Order',
                html: `
                    <div class="text-start">
                        <p><strong>Order ID:</strong> ${$('#order_id').val()}</p>
                        <p><strong>Date:</strong> ${$('#order_date').val()}</p>
                        <p><strong>Customer:</strong> ${customerName}</p>
                        <p><strong>Items:</strong> ${orderItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
                        <hr>
                        <p><strong>Subtotal:</strong> Rs. ${subtotal.toFixed(2)}</p>
                        <p><strong>Discount:</strong> ${discount}% (Rs. ${(subtotal * discount/100).toFixed(2)})</p>
                        <p class="fw-bold">Total: Rs. ${total.toFixed(2)}</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Place Order',
                cancelButtonText: 'Cancel',
                width: '600px'
            });

            if (isConfirmed) {
                await this.processOrder(customerName, orderItems, subtotal, discount, total);
            }

        } catch (error) {
            console.error("Order placement error:", error);
            this.showAlert('Error', 'Failed to process order', 'error');
        }
    }

    async processOrder(customerName, orderItems, subtotal, discount, total) {
        try {
            // Update stock
            this.cartItems.forEach(cartItem => {
                const item = item_db.find(i => i.id === cartItem.item.id);
                if (item) item.stock -= cartItem.quantity;
            });

            // Update customer balance
            const customer = customer_db.find(c => c.name === customerName);
            if (customer) customer.balance -= total;

            // Create and save order
            const order = new OrderModel(
                parseInt($('#order_id').val().replace('ORD-', '')),
                $('#order_date').val(),
                customerName,
                orderItems,
                subtotal,
                discount,
                total
            );

            if (!OrderModel.validate(order)) {
                throw new Error("Invalid order data");
            }

            order_db.push(order);
            this.resetAfterOrder();

            this.showAlert('Success', 'Order placed successfully!', 'success');

        } catch (error) {
            console.error("Order processing error:", error);
            throw error;
        }
    }

    resetAfterOrder() {
        this.cartItems = [];
        this.updateCartDisplay();
        this.loadProducts();
        this.generateOrderId();
        $('#discount').val('0').trigger('input');
        $('#search_customer_input').val('');
        $('#customer_details').empty();
    }

    showToast(message, icon = 'success') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        Toast.fire({ icon, title: message });
    }

    showAlert(title, text, icon) {
        Swal.fire({ title, text, icon });
    }
}*/
