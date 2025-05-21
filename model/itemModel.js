export default class ItemModel{
    constructor(id,description , unitPrice, quantity, picture ) {
        this.id = id;
        this.description = description;
        this.unitPrice = Number(unitPrice);
        this.quantity = quantity;
        this.picture = picture;
    }
}