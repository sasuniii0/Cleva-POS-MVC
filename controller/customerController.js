import CustomerModel from "../model/customerModel.js";
import {customer_db} from "../db/db.js";
import {syncCustomers} from "./ordersController.js";

let selectedCustomerIndex = null;

//load customer records
function loadCustomers(){
    $('#tableBody').empty();
    customer_db.map((customer, index) => {
        let name = customer.name;
        let contact = customer.contactNumber;
        let email = customer.email;
        let nic = customer.nic;
        let address = customer.address;

        let data = `<tr>
                            <td>${index +1 }</td>
                            <td>${name}</td>
                            <td>${email}</td>
                            <td>${address}</td>
                            <td>${nic}</td>
                            <td>${contact}</td>
        </tr>`
        $('#tableBody').append(data);
    })
}


(function() {
    'use strict';

    function validateField(field) {
        if (field[0].checkValidity()) {
            field.removeClass('is-invalid');
            field.addClass('is-valid');
        } else {
            field.removeClass('is-valid');
            field.addClass('is-invalid');
        }
    }

    const form = $('#customerForm');
    form.addClass('needs-validation');

    $('.form-control').on('input', function() {
        validateField($(this));
    });

    $('#floatingContact').on('input', function() {
        const phoneRegex = /^0\d{9}$/;
        if (phoneRegex.test($(this).val())) {
            this.setCustomValidity('');
        }
    });

    $('#floatingNic').on('input', function() {
        if ($(this).val().length < 10) {
            this.setCustomValidity('NIC must be at least 10 characters');
        } else {
            this.setCustomValidity('');
        }
    });
})();

// Handle save/update
$('#BtnSubmit').on('click', function() {

    const form = $('#customerForm')[0];

    if (!form.checkValidity()) {
        form.classList.add('was-validated');

        const firstInvalid = $('.is-invalid').first();
        if (firstInvalid.length) {
            Swal.fire({
                title: 'Validation Error',
                text: firstInvalid.siblings('.invalid-feedback').text() || 'Please fill this field correctly',
                icon: 'error'
            });
            firstInvalid.focus();
        }

        return;
    }

    const name = $('#floatingName').val();
    const contact = $('#floatingContact').val();
    const email = $('#floatingEmail').val();
    const nic = $('#floatingNic').val();
    const address = $('#floatingAddress').val();

    if (!name || !contact || !email || !nic || !address) {
        Swal.fire('Error!', 'Please fill all fields', 'error');
        return;
    }

    if (selectedCustomerIndex !== null) {
        customer_db[selectedCustomerIndex] = new CustomerModel(name, contact, email, nic, address);
        Swal.fire('Updated!', 'Customer updated successfully', 'success');
    } else {
        customer_db.push(new CustomerModel(name, contact, email, nic, address));
        Swal.fire('Added!', 'New customer added', 'success');
    }
    resetForm();
    syncCustomers()
});

// Delete customer
$('#BtnDelete').on('click', function() {
    if (selectedCustomerIndex === null || selectedCustomerIndex === undefined) {
        Swal.fire('Error!', 'Please select a customer first', 'error');
        return;
    }

    Swal.fire({
        title: 'Confirm Delete',
        text: "Are you sure you want to delete this customer?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            customer_db.splice(selectedCustomerIndex, 1);
            loadCustomers();
            resetForm();

            Swal.fire('Deleted!', 'Customer has been deleted', 'success');
        }
    });
});


// Reset Form
$('#BtnReset').on('click', function() {
    resetForm();
});

function resetForm() {
    $('#customerForm')[0].reset();
    $('.form-control').removeClass('is-valid is-invalid');
    $('#customerForm').removeClass('was-validated');
    selectedCustomerIndex = null;
    $('#BtnSubmit').text('Save');
    loadCustomers();
}

$(document).ready(function() {
    loadCustomers();
});

//click on table row
$('#tableBody').on('click', 'tr', function() {
    const cells = $(this).find('td');

    $('.form-control').removeClass('is-valid is-invalid');

    const id = cells.eq(0).text();
    const name = cells.eq(1).text();
    const email = cells.eq(2).text();
    const address = cells.eq(3).text();
    const nic = cells.eq(4).text();
    const contact = cells.eq(5).text();

    $('#floatingId').val(id).prop('disabled', true);
    $('#floatingName').val(name);
    $('#floatingContact').val(contact);
    $('#floatingEmail').val(email);
    $('#floatingNic').val(nic);
    $('#floatingAddress').val(address);

    selectedCustomerIndex = parseInt(cells.eq(0).text()) - 1;

    $('#BtnSubmit').text('Update');

    // $(this).attr('data-selected-index', rowIndex);

    $('#tableBody tr').removeClass('table-primary');
    $(this).addClass('table-primary');

})
