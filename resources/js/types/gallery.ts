export type PoolKey = 'upper' | 'lower';
export type GalleryCategory =
    | 'room'
    | 'pool'
    | 'kitchen'
    | 'cottage'
    | 'others';

export type GalleryOptions = {
    pools: { value: PoolKey; label: string }[];
    categories: { value: GalleryCategory; label: string }[];
};

export type SiteMedia = {
    id: number;
    media_path: string;
    media_url: string | null;
    media_type: 'image' | 'video';
    label: string | null;
    sort_order: number;
    pool: PoolKey | null;
    category: GalleryCategory | null;
};
