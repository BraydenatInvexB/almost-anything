export interface StoredSearchPhoto {
  dataUrl: string;
  name: string;
}

export interface PhotoSearchHint {
  /** Keywords suitable for catalog search. */
  query: string;
  /** Short human-readable product label. */
  label: string;
}
