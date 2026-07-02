export interface NavItem {
  name: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Origin',   href: '#hero' },
  { name: 'Team',     href: '/team' },
  { name: 'Partners', href: '/partners' },
  { name: 'Contact',  href: '/contact' },
  { name: 'Careers',  href: '/careers' },
];

/** Storage quota tiers shown in the UI (bytes). */
export const STORAGE_TIERS = {
  FREE:  1   * 1024 ** 3,  // 1 GB
  BASIC: 10  * 1024 ** 3,  // 10 GB
  PRO:   100 * 1024 ** 3,  // 100 GB
} as const;

export type StorageTier = keyof typeof STORAGE_TIERS;

/** Upload limits. */
export const UPLOAD_LIMITS = {
  /** Max size per uploaded file. */
  MAX_FILE_BYTES:       100 * 1024 ** 3,   // 100 GB
  /** Max size per file for a simple (presigned) upload. */
  SIMPLE_MAX_BYTES:    50 * 1024 * 1024,   // 50 MB
  /** Files larger than this trigger multipart upload. */
  MULTIPART_THRESHOLD: 50 * 1024 * 1024,   // 50 MB
  /** Target size for each multipart part. */
  PART_SIZE:           50 * 1024 * 1024,   // 50 MB
  /** Max concurrent part uploads. */
  MAX_CONCURRENT_PARTS: 4,
} as const;

/** Default pagination page size. */
export const DEFAULT_PAGE_SIZE = 20;
