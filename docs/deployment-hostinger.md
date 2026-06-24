# Hostinger and cPanel Deployment Guide

This guide is for deploying the Q8 Private Resort booking system to Hostinger Shared Hosting, cPanel hosting, or similar free/shared hosting providers.

Do not commit real production secrets. Use `.env.hostinger.example` as a template, then create a real `.env` file on the server.

## Deployment Overview

The project is a Laravel + Inertia React application. The backend runs on PHP and MySQL. The frontend assets must be built with Node/NPM before deployment or on the server if Node is available.

Typical shared-hosting flow:

1. Prepare the project locally.
2. Build frontend assets.
3. Upload project files to hosting.
4. Point the domain document root to `public`.
5. Create and configure the MySQL database.
6. Configure `.env`.
7. Run migrations and cache commands.
8. Verify login, bookings, uploads, mail, reports, and receipts.

## Prerequisites

- PHP 8.3 or newer.
- Composer 2.
- MySQL or MariaDB database.
- Node.js and NPM locally for `npm run build`.
- SSH access is strongly recommended.
- Domain or subdomain pointed to the hosting account.

If SSH or Composer is not available on the host, run Composer and NPM locally, then upload the prepared project including `vendor` and built `public/build` files.

## PHP Requirements

Enable these PHP extensions if your hosting panel allows it:

- `ctype`
- `curl`
- `dom`
- `fileinfo`
- `filter`
- `hash`
- `mbstring`
- `openssl`
- `pdo`
- `pdo_mysql`
- `session`
- `tokenizer`
- `xml`
- `zip`
- `gd` or `imagick` for image processing compatibility

Set PHP memory limit to at least `256M` if possible.

## Composer Requirements

On the server, run:

```bash
composer install --no-dev --optimize-autoloader
```

If Composer is not available on Hostinger/cPanel, run this locally:

```bash
composer install --no-dev --optimize-autoloader
```

Then upload the project with the generated `vendor` directory.

## Node and NPM Build Requirements

Build the frontend before deployment:

```bash
npm install
npm run build
```

Upload the generated `public/build` directory to the server.

On most shared hosting plans, it is safer to build locally instead of relying on Node on the server.

## Recommended Folder Structure

Best setup:

```text
/home/username/resort_booking
/home/username/domains/your-domain.com/public_html -> points to resort_booking/public
```

If your host does not allow changing the document root, place Laravel outside `public_html` and copy only the contents of Laravel's `public` directory into `public_html`. Then update `public_html/index.php` paths to point to the real `vendor/autoload.php` and `bootstrap/app.php`.

Example:

```php
require __DIR__.'/../resort_booking/vendor/autoload.php';
$app = require_once __DIR__.'/../resort_booking/bootstrap/app.php';
```

The exact relative path depends on your cPanel folder layout.

## Environment Configuration

Copy the Hostinger template:

```bash
cp .env.hostinger.example .env
```

Then set real values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
APP_KEY=base64:...
PRIMARY_ADMIN_PASSWORD=YourStrongPassword123!
```

Generate an app key:

```bash
php artisan key:generate --show
```

Paste the generated key into `APP_KEY`.

Never upload a development `.env` with `APP_DEBUG=true`.

## Database Setup

In Hostinger or cPanel:

1. Open MySQL Databases.
2. Create a database.
3. Create a database user.
4. Assign the user to the database.
5. Grant all privileges.
6. Put those credentials in `.env`.

Example:

```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u123456789_resort
DB_USERNAME=u123456789_resortuser
DB_PASSWORD=strong-database-password
```

Run migrations:

```bash
php artisan migrate --force
```

If SSH is unavailable, run migrations locally against the production database only if your hosting provider allows remote MySQL connections. Otherwise, use a migration-capable deployment tool or temporarily run the command through a secure hosting terminal.

## Storage Configuration

Uploads include:

- Resort category cover images.
- Resort gallery images.
- Landing page home/about images.
- About section media.
- About section videos.

Recommended shared-hosting settings:

```env
FILESYSTEM_DISK=local
UPLOAD_DISK=public
```

### Option A: Storage Symlink

Use this when your hosting provider allows symbolic links:

```bash
php artisan storage:link
```

This creates:

```text
public/storage -> storage/app/public
```

Use this option when:

- Your domain document root points to Laravel's `public` directory.
- Symlinks are allowed by Hostinger/cPanel.
- You can run Artisan commands through SSH.

Verify it works:

1. Upload a resort image from the admin panel.
2. Confirm the file exists under `storage/app/public`.
3. Open a generated image URL like `https://your-domain.com/storage/...`.
4. Confirm it returns HTTP 200 and displays the image.

### Option B: Manual Storage Mapping

Use this when symlinks are restricted.

Create this public folder:

```text
public/storage
```

Then set `.env`:

```env
UPLOAD_DISK=public
PUBLIC_DISK_ROOT=/home/username/domains/your-domain.com/public_html/storage
PUBLIC_DISK_URL=https://your-domain.com/storage
```

With this setup, new uploads are written directly to the public `storage` folder. Make sure the folder is writable by PHP.

Recommended permissions:

```text
folders: 755 or 775
files: 644
```

If your host requires looser permissions for PHP uploads, use the hosting file manager's recommended write settings, but avoid `777` unless there is no other option.

Manual copy fallback:

If files are already in `storage/app/public`, copy them into `public/storage` while preserving folders:

```text
storage/app/public/resort-options        -> public/storage/resort-options
storage/app/public/resort-option-gallery -> public/storage/resort-option-gallery
storage/app/public/site-settings         -> public/storage/site-settings
```

After future uploads, prefer the `PUBLIC_DISK_ROOT` setup so the app writes directly to the public folder instead of requiring repeated manual copying.

## Upload and Media Compatibility

Localhost:

```env
UPLOAD_DISK=public
PUBLIC_DISK_ROOT=
PUBLIC_DISK_URL="${APP_URL}/storage"
```

Then run:

```bash
php artisan storage:link
```

Hostinger/cPanel with symlink:

```env
UPLOAD_DISK=public
PUBLIC_DISK_ROOT=
PUBLIC_DISK_URL="${APP_URL}/storage"
```

Then run:

```bash
php artisan storage:link
```

Hostinger/cPanel without symlink:

```env
UPLOAD_DISK=public
PUBLIC_DISK_ROOT=/home/username/domains/your-domain.com/public_html/storage
PUBLIC_DISK_URL=https://your-domain.com/storage
```

Test all media types after deployment:

- Upload a resort cover image.
- Upload multiple gallery images.
- Upload about section images.
- Upload about section videos.
- Confirm admin modals display media.
- Confirm the customer landing page displays media.

## Mail Configuration

Mail is required for:

- Password reset verification codes.
- Booking confirmation emails.
- Admin booking notifications.

### Hostinger Email SMTP

Example:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=booking@your-domain.com
MAIL_PASSWORD=your-mailbox-password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=booking@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

Some Hostinger accounts may use port `587` with TLS:

```env
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

### Gmail SMTP

Use a Google App Password, not your normal Gmail password:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=yourgmail@gmail.com
MAIL_PASSWORD=your-google-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=yourgmail@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

Verify mail:

1. Request a password reset code.
2. Submit a test booking.
3. Confirm the customer and admin emails are delivered.

## Cache Configuration

Redis is usually unavailable on shared hosting. Use file cache:

```env
CACHE_STORE=file
```

Then run:

```bash
php artisan config:cache
```

If you use `CACHE_STORE=database`, make sure migrations have run before cache commands.

## Session Configuration

Recommended:

```env
SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

Run migrations before using database sessions:

```bash
php artisan migrate --force
```

If database sessions cause hosting issues, use:

```env
SESSION_DRIVER=file
```

## Queue Configuration

Recommended default for shared hosting:

```env
QUEUE_CONNECTION=database
```

Run migrations:

```bash
php artisan migrate --force
```

If you cannot run a persistent queue worker, use:

```env
QUEUE_CONNECTION=sync
```

For database queues, configure a cron job:

```bash
php /home/username/resort_booking/artisan queue:work --stop-when-empty --tries=3
```

Run it every minute if your hosting plan supports cron.

## Build and Deployment Commands

Local preparation:

```bash
composer install --no-dev --optimize-autoloader
npm install
npm run build
```

Server setup:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If you change `.env`, clear and rebuild caches:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Hostinger note: if `cache:clear` fails with database cache, switch to `CACHE_STORE=file` or ensure the database is reachable and migrated.

## Security Checklist

- Set `APP_ENV=production`.
- Set `APP_DEBUG=false`.
- Use HTTPS for `APP_URL`.
- Generate a unique `APP_KEY`.
- Set a strong `PRIMARY_ADMIN_PASSWORD`.
- Never commit `.env`.
- Never expose the project root publicly.
- Public document root should be Laravel's `public` directory.
- Protect `.env`, `storage`, `vendor`, `database`, and `bootstrap/cache` from direct public access.
- Use strong database and email passwords.
- Set `SESSION_SECURE_COOKIE=true` when using HTTPS.
- Keep uploaded file validation enabled.
- Back up the database regularly.
- Back up uploaded media regularly.
- Remove installer/test files from public folders.
- Disable directory listing in cPanel.

## Deployment Checklist

Before upload:

- `composer install --no-dev --optimize-autoloader`
- `npm run build`
- `.env` prepared from `.env.hostinger.example`
- `APP_DEBUG=false`
- `APP_KEY` generated
- `PRIMARY_ADMIN_PASSWORD` set

On hosting:

- Domain points to Laravel `public` directory.
- MySQL database and user created.
- `.env` uploaded outside public access.
- Storage symlink or manual mapping configured.
- File permissions checked.
- Migrations run.
- Config, route, and view caches built.
- SMTP tested.

## Post-Deployment Testing Checklist

1. Visit the public landing page.
2. Log in as the primary admin.
3. Create a resort option.
4. Upload a resort cover image.
5. Upload multiple gallery images.
6. Upload about section image/video media.
7. Submit a customer booking.
8. Confirm the booking in admin.
9. Verify the booking appears in admin calendar.
10. Verify the booking appears in the customer booked dates calendar.
11. Open the receipt page from a signed receipt link.
12. Download receipt PDF.
13. Request a password reset code.
14. Verify the code and reset the password.
15. Export reports as Excel and PDF.
16. Create, edit, and delete a non-protected admin user.
17. Confirm the protected primary admin cannot be deleted.
18. Test the site on mobile width.
19. Confirm dark mode remains readable.
20. Confirm direct `/storage/...` media URLs load.

## Troubleshooting

### White screen or 500 error

Check:

- `.env` exists.
- `APP_KEY` is set.
- PHP version is 8.3+.
- `vendor` directory exists.
- `storage` and `bootstrap/cache` are writable.
- `APP_DEBUG=false` in production, but temporarily check logs in `storage/logs`.

### Images do not display

Check:

- `UPLOAD_DISK=public`.
- `PUBLIC_DISK_URL` matches your domain.
- `public/storage` exists.
- Symlink works, or `PUBLIC_DISK_ROOT` points to a real public folder.
- Uploaded files exist in the expected folder.
- File permissions allow web access.

### Uploads fail

Check:

- PHP `upload_max_filesize`.
- PHP `post_max_size`.
- Folder write permissions.
- File type and size validation.
- Hosting storage quota.

### Mail does not send

Check:

- SMTP host, port, username, password, and encryption.
- Mailbox credentials are correct.
- Gmail uses an App Password.
- Hosting provider allows outbound SMTP.

### `php artisan migrate --force` fails

Check:

- Database name, username, and password.
- Database user privileges.
- `DB_HOST`, usually `localhost` on Hostinger.
- Remote database access if running migrations from your local machine.

### Cache commands fail

If `CACHE_STORE=database`, run migrations first. On shared hosting, `CACHE_STORE=file` is usually simpler.

### CSS or JS missing

Run:

```bash
npm run build
```

Upload `public/build` and confirm `public/build/manifest.json` exists.
