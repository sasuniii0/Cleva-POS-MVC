import ItemModel from "../model/itemModel.js";
import { item_db} from "../db/db.js";

let selectedItemIndex = null;
let currentImageFile = null;

// Image preview functionality
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


//load item records
function loadItems(){
    $('#table-body').empty();
    item_db.map((item, index) => {
        let desc = item.description;
        let price = item.unitPrice;
        let quantity = item.quantity;
        let pic = item.picture;

        let data = `<tr>
                            <td>${index +1 }</td>
                            <td>${desc}</td>
                            <td>${price}</td>
                            <td>${quantity}</td>
                            <td>${pic ? `<img src = "${pic}" class = "img-thumbnail" width = "50">` : 'No Image'}</td>
        </tr>`
        $('#table-body').append(data);
    })
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
        item_db[selectedItemIndex] = new ItemModel(desc, price, quantity, imageUrl);
        Swal.fire('Updated!', 'Item updated successfully', 'success');
    } else {
        item_db.push(new ItemModel(desc, price, quantity, imageUrl));
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
