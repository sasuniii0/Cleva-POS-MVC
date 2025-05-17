export default class OrderModel {
    constructor(customerName, items) {
        this.customerName = customerName;
        this.items = items;
        this.date = new Date();
        this.total = items.reduce((sum, item) => sum + item.total, 0);
        this.status = "Pending"; // or whatever status system you use
    }
}