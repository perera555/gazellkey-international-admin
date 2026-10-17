"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { DELETE_LABEL, findResource } from "@/lib/resources";

// "Delete" for an active record, "Restore" for a deleted one. Delete is a
// soft delete everywhere: the record is disabled (archived / inactive),
// never erased. How each resource does it is in lib/resources.ts.
export default function DeleteRestore({
  resourceKey,
  id,
  title,
  status,
  small = false,
  redirectTo,
}: {
  resourceKey: string;
  id: string;
  title: string;
  status: unknown;
  small?: boolean;
  redirectTo?: string; // after deleting, e.g. back to the list
}) {
  const resource = findResource(resourceKey)!;
  const path = `${resource.endpoint}/${id}`;

  if (status == resource.remove.removedStatus) {
    return (
      <ConfirmAction
        small={small}
        tone="gold"
        label={resource.restore.label}
        title={`Restore ${title}?`}
        message={resource.restore.note}
        method="PUT"
        path={path}
        body={resource.restore.body}
      />
    );
  }

  return (
    <ConfirmAction
      small={small}
      label={DELETE_LABEL}
      title={`Delete ${title}?`}
      message={resource.remove.note}
      method={resource.remove.method}
      path={path}
      body={resource.remove.body}
      redirectTo={redirectTo}
    />
  );
}
