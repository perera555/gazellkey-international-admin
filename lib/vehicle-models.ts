// Vehicle makes and models for the spare-parts "Fits these models" picker.
// Same popular list as the website (gazellekey-web lib/vehicle-models.ts);
// models already used in the catalogue are added from GET /api/vehicles/models.
// A part's models are saved as "Make Model" (e.g. "Toyota Aqua"), so makes
// are one word.

export const POPULAR_MODELS: { make: string; models: string[] }[] = [
  { make: "Toyota", models: ["Aqua", "Axio", "Corolla", "Prius", "Vitz", "Yaris", "Premio", "Allion", "C-HR", "Raize", "Hilux", "HiAce", "Land Cruiser"] },
  { make: "Honda", models: ["Vezel", "Fit", "Grace", "Civic", "CR-V", "Insight", "N-Box"] },
  { make: "Nissan", models: ["Leaf", "X-Trail", "Sunny", "March", "Note", "Dayz", "Caravan", "Navara"] },
  { make: "Suzuki", models: ["Alto", "Wagon R", "Swift", "Spacia", "Hustler", "Every", "Celerio"] },
  { make: "Mitsubishi", models: ["Montero", "Outlander", "Pajero", "L200", "Lancer"] },
  { make: "Mazda", models: ["Axela", "Demio", "CX-5", "Bongo"] },
  { make: "Hyundai", models: ["Tucson", "Santa Fe", "Elantra", "Grand i10"] },
  { make: "Kia", models: ["Sportage", "Sorento", "Picanto"] },
  { make: "Caterpillar", models: ["320D", "312", "D6", "424B"] },
  { make: "Komatsu", models: ["PC200", "PC130", "D65"] },
  { make: "JCB", models: ["3CX", "4CX", "JS205"] },
  { make: "Hitachi", models: ["ZX200", "ZX130"] },
];

// "Toyota Aqua" -> { make: "Toyota", model: "Aqua" }
export function splitModel(value: string) {
  const [make, ...model] = value.trim().split(/\s+/);
  return { make: make ?? "", model: model.join(" ") };
}

// Every "Make Model" we know: popular list + catalogue, no duplicates
export function allModels(catalogue: { make: string; models: { model: string }[] }[]): string[] {
  const seen = new Map<string, string>();
  const add = (make: string, model: string) => {
    const value = `${make.trim()} ${model.trim()}`;
    if (!seen.has(value.toLowerCase())) seen.set(value.toLowerCase(), value);
  };
  for (const entry of POPULAR_MODELS) entry.models.forEach((model) => add(entry.make, model));
  for (const entry of catalogue) entry.models.forEach((model) => add(entry.make, model.model));
  return [...seen.values()];
}
