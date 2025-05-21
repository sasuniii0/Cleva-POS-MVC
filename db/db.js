export let customer_db = [];
export let item_db = [];
export let order_db = [];

export function saveAllDatabases() {
    localStorage.setItem('customer_db', JSON.stringify(customer_db));
    localStorage.setItem('item_db', JSON.stringify(item_db));
    localStorage.setItem('order_db', JSON.stringify(order_db));
}