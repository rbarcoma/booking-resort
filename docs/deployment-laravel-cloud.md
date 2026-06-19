# Laravel Cloud Deployment Checklist

Use this checklist before deploying the Q8 Private Resort booking system.

## Secret Handling

Never commit these values to git:

- `APP_KEY`
- `PRIMARY_ADMIN_PASSWORD`
- `DB_PASSWORD`
- `MAIL_PASSWORD`
- `MAIL_USERNAME` when it is provider-specific
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `POSTMARK_API_KEY`
- `RESEND_API_KEY`
- `SLACK_BOT_USER_OAUTH_TOKEN`
- Any `.env`, `.env.production`, `.env.backup`, `auth.json`, or private key file

The repository should only contain safe templates such as `.env.example` and `.env.laravel-cloud.example`.

## Required Production Environment

Start from `.env.laravel-cloud.example` and set real values in Laravel Cloud environment variables.

Required values:

- `APP_KEY`: generated with `php artisan key:generate --show`
- `APP_URL`: the production domain
- `PRIMARY_ADMIN_PASSWORD`: strong password with 12+ characters, uppercase, lowercase, number, and special character
- Database variables from the attached Laravel Cloud database
- Mail variables from the production mail provider
- Upload storage variables when `UPLOAD_DISK=s3`

## Recommended Laravel Cloud Services

- Database: PostgreSQL or MySQL managed database
- Queue: database queue is supported by the current app config
- Cache: database cache is supported by the current app config
- Session: database sessions are supported by the current app config
- Storage: object storage via `UPLOAD_DISK=s3`
- Mail: SMTP, Postmark, Resend, SES, or another production mail provider

## Configuration Values

Production-safe defaults:

```env
APP_ENV=production
APP_DEBUG=false
LOG_STACK=stderr
LOG_LEVEL=warning
SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database
UPLOAD_DISK=s3
```

Local development defaults:

```env
APP_ENV=local
APP_DEBUG=true
DB_CONNECTION=sqlite
FILESYSTEM_DISK=local
UPLOAD_DISK=public
MAIL_MAILER=log
QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database
```

## Deployment Commands

Run these during or after deployment:

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Run a queue worker if queued mail or jobs are enabled:

```bash
php artisan queue:work --tries=3 --timeout=90
```

## Storage Checks

For Laravel Cloud object storage:

- Keep `league/flysystem-aws-s3-v3` installed.
- Set `UPLOAD_DISK=s3`.
- Set `AWS_*` variables from the attached object storage bucket.
- Confirm uploaded resort/category/about media URLs return HTTP 200.

For localhost:

```bash
php artisan storage:link
```

## Verification After Deploy

1. Visit `/up` and confirm the health endpoint responds.
2. Log in as the protected primary administrator.
3. Create a resort option image and confirm it displays in admin and public pages.
4. Submit a customer booking.
5. Confirm the booking as admin.
6. Confirm the booking appears on the admin calendar and public booked dates calendar.
7. Send a password reset code and confirm mail delivery.
8. Export PDF and Excel reports.
9. Confirm `APP_DEBUG=false` in production by checking that detailed exception pages are not visible.
