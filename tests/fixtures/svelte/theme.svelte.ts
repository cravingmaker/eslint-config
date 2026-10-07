type Preferences = { readonly theme: "dark" | "light" };

export const preferences: Preferences = $state({ theme: "light" });
