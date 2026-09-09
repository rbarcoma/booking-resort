<?php

return [
    'primary_admin' => [
        'name' => env('PRIMARY_ADMIN_NAME', 'Renante Barcoma'),
        'email' => env('PRIMARY_ADMIN_EMAIL', 'renantebarcoma1@gmail.com'),
        'password' => env('PRIMARY_ADMIN_PASSWORD'),
    ],

    'booking' => [
        'payment_quote_expiration_minutes' => (int) env('BOOKING_PAYMENT_QUOTE_EXPIRATION_MINUTES', 120),
    ],
];
