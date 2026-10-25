// Lazily loads the Google Maps JavaScript API (Places library) exactly once.
// The API key is read from the VITE_GOOGLE_MAPS_API_KEY environment variable.

let loader: Promise<typeof window.google> | null = null;

export function getGoogleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return key && key.trim() ? key.trim() : undefined;
}

export function loadGoogleMaps(apiKey: string): Promise<typeof window.google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const callbackName = `__initGoogleMaps_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      resolve(window.google);
      delete (window as unknown as Record<string, unknown>)[callbackName];
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loader = null;
      reject(new Error("Failed to load the Google Maps JavaScript API"));
    };
    document.head.appendChild(script);
  });

  return loader;
}

declare global {
  interface Window {
    google: typeof globalThis & {
      maps: {
        places: {
          AutocompleteService: new () => GoogleAutocompleteService;
          AutocompleteSessionToken: new () => object;
          PlacesService: new (attrContainer: HTMLElement) => GooglePlacesService;
          PlacesServiceStatus: { OK: string };
        };
      };
    };
  }
}

export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: {
      input: string;
      componentRestrictions?: { country: string | string[] };
      types?: string[];
      sessionToken?: object;
    },
    callback: (
      predictions: { description: string; place_id: string }[] | null,
      status: string,
    ) => void,
  ) => void;
};

export type GooglePlacesService = {
  getDetails: (
    request: { placeId: string; fields: string[]; sessionToken?: object },
    callback: (
      place: { address_components?: GoogleAddressComponent[] } | null,
      status: string,
    ) => void,
  ) => void;
};
