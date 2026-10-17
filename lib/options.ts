import "server-only";
import { apiGet } from "@/lib/api";
import { Option, Resource } from "@/lib/resources";
import { Supplier } from "@/lib/types";
import { allModels } from "@/lib/vehicle-models";

export type FormOptions = { suppliers?: Option[]; vehicleModels?: Option[] };

// Options a form loads from the API (e.g. the supplier picker).
// Users without suppliers:read simply get an empty list.
export async function formOptions(resource: Resource): Promise<FormOptions> {
  const needs = (from: string) =>
    resource.sections.some((section) => section.fields.some((field) => field.optionsFrom == from));
  const options: FormOptions = {};

  if (needs("suppliers")) {
    const query = resource.division ? `&division=${resource.division}` : "";
    const result = await apiGet<Supplier[]>(`/api/suppliers?pageSize=100${query}`);
    options.suppliers = result.ok
      ? result.data.map((supplier) => ({
          value: supplier.id,
          label: `${supplier.name}${supplier.status == "ACTIVE" ? "" : " (inactive)"}`,
        }))
      : [];
  }

  if (needs("vehicleModels")) {
    // popular models + every model already used in the catalogue
    const result = await apiGet<{ make: string; models: { model: string }[] }[]>("/api/vehicles/models");
    options.vehicleModels = allModels(result.ok ? result.data : []).map((model) => ({ value: model, label: model }));
  }

  return options;
}
