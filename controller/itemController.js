import ItemModel from "../model/itemModel.js";
import { item_db} from "../db/db.js";
import {syncAvailableItems} from "./ordersController.js";

let selectedItemIndex = null;
let currentImageFile = null;

export function loadItemsOnTable() {

    $('#item_tbody').empty();

    item_db.map((item, index) => {
        let name = item.description;
        let price = item.unitPrice;
        let qoh = item.quantity;

        let data = `<tr>
                      <td>${'I' + String(index + 1).padStart(3, '0')}</td>
                      <td>${name}</td>
                      <td>${price}</td>
                      <td>${qoh}</td>
                  </tr>`

        $('#item_tbody').append(data);
    });
}

document.getElementById('formFileMultiple').addEventListener('change', function(e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    if (this.files && this.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        }

        reader.readAsDataURL(this.files[0]);
    } else {
        preview.innerHTML = '<span class="text-muted">Preview will appear here</span>';
    }
});


function loadItems(){
    $('#table-body').empty();
    item_db.forEach((item, index) => {
        const rowId = `item-row-${index}`;
        const row = `
            <tr id="${rowId}" class="item-row">
                <td>${index + 1}</td>
                <td>${item.description || 'N/A'}</td>
                <td>${typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : '0.00'}</td>                
                <td>${item.quantity || 0}</td>
                <td>${item.picture ? `<img src="${item.picture}" class="img-thumbnail" width="50">` : 'No Image'}</td>
            </tr>
        `;
        $("#table-body").append(row);
        syncAvailableItems()
    });
}

$('#formFileMultiple').on('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        currentImageFile = file;
        previewImage(file);
    }
});

function previewImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        $('#imagePreview').html(`<img src="${e.target.result}" class="img-thumbnail" width="100">`);
    };
    reader.readAsDataURL(file);
}

// Handle save/update
$('#Btn-Submit').on('click', function(e) {

    e.preventDefault()
    const id = $('#floatingItemId').val();
    const desc = $('#floatingDesc').val();
    const price = $('#floatingPrice').val();
    const quantity = $('#floatingQty').val();

    if (!desc || !price || !quantity ) {
        Swal.fire('Error!', 'Please fill all fields', 'error');
        return;
    }

    let imageUrl = '';
    if (currentImageFile) {
        imageUrl = URL.createObjectURL(currentImageFile);
    } else if (selectedItemIndex !== null && item_db[selectedItemIndex].picture) {
        imageUrl = item_db[selectedItemIndex].picture;
    }

    if (selectedItemIndex !== null) {
        item_db[selectedItemIndex] = new ItemModel( id,desc, price, quantity, imageUrl);
        console.log(id)
        Swal.fire('Updated!', 'Item updated successfully', 'success');
    } else {
        const newId = item_db.length + 1;
        item_db.push(new ItemModel(newId,desc, price, quantity, imageUrl));
        console.log(newId)

        Swal.fire('Added!', 'New item added', 'success');
    }
    resetForm();
});

// Delete item
$('#Btn-Delete').on('click', function() {
    if (selectedItemIndex === null || selectedItemIndex === undefined) {
        Swal.fire('Error!', 'Please select a item  first', 'error');
        return;
    }

    Swal.fire({
        title: 'Confirm Delete',
        text: "Are you sure you want to delete this item?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            item_db.splice(selectedItemIndex, 1);
            loadItems();
            resetForm();

            Swal.fire('Deleted!', 'Item has been deleted', 'success');
        }
    });
});

// Reset Form
$('#Btn-Reset').on('click', function() {
    resetForm();
});

function resetForm() {
    $('#itemForm')[0].reset();
    selectedItemIndex = null;
    currentImageFile = null;
    $('#Btn-Submit').text('Save');
    $('#floatingItemId').prop('disabled', false);
    $('#imagePreview').empty();
    loadItems();
}

$(document).ready(function() {
    loadItems();
});

//click on table row
$('#table-body').on('click', 'tr', function() {
    const cells = $(this).find('td');

    const id = cells.eq(0).text();
    const desc = cells.eq(1).text();
    const price = cells.eq(2).text();
    const qty = cells.eq(3).text();
    const imgElement = cells.eq(4).find('img');
    const pic = imgElement.length ? imgElement.attr('src') : '';


    $('#floatingItemId').val(id).prop('disabled', true);
    $('#floatingDesc').val(desc);
    $('#floatingPrice').val(price);
    $('#floatingQty').val(qty);
    $('#imagePreview').html(`<img src="${pic}" class="img-thumbnail" width="100">`);

    selectedItemIndex = parseInt(cells.eq(0).text()) - 1;

    $('#Btn-Submit').text('Update');

    //(this).attr('data-selected-index', rowIndex);

    $('#table-body tr').removeClass('table-primary');
    $(this).addClass('table-primary');

})
