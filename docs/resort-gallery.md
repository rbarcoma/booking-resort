# Resort photo gallery

The public `/gallery` page is linked by **See All** on the large About Us image. The link appears on hover or keyboard focus and stays visible on touch devices. It uses the same navbar as the landing page; section links return to the corresponding landing-page section.

The gallery displays two independent sections, **Upper Pool** and **Lower Pool**. Each contains **Room**, **Pool**, **Kitchen**, **Cottage**, and **Others**, including an empty-state message when no images have been assigned.

## Managing images

1. Open **Admin → Landing page content → About section → Edit**.
2. Select a pool and category, choose one or more files, and click **Upload media**. Every file in that batch receives the selected pool/category.
3. To move an existing image, change its pool/category on its card and click **Save grouping**. Captions are optional. No re-upload is needed.
4. Use **Delete → Confirm delete** to remove a file from the showcase, gallery, and storage.

The gallery reads the About media library. Resort-option covers and galleries remain managed separately under Resort Options; they are not automatically assigned or duplicated into the About library.

Videos remain supported in the About showcase and admin library, but the See All page displays images only. The existing shared media storage and access rules remain in use.

## Existing uploads and deployment

Run `php artisan migrate` when deploying. The additive migration `2026_09_06_000001_add_gallery_grouping_to_site_setting_media_table` adds nullable pool/category fields and makes a legacy standalone About image manageable in the library without moving or copying its file.

Existing uploads are preserved, with no pool guessed. They appear under **Needs grouping** in admin and stay in the landing-page showcase. Assign their pool and category before they appear on the public gallery. Build the updated frontend with `npm run build`.
