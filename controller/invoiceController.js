$(document).ready(function() {
    $('.view-invoice').click(function() {
        const invoiceId = $(this).data('invoice');
        $('#invoiceModal').modal('show');
    });

    $('.print-invoice').click(function() {
        const invoiceId = $(this).data('invoice');
        window.print();
    });

    $('form').submit(function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'warning',
            text: 'Filter functionality would be implemented here!',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    });
});