import { adminFetch, type ApiSuccess } from "@/lib/admin-api";

/** Sanitized admin profile from GET/PATCH /api/admin/ */
export type AdminMyProfile = {
  name: string;
  firstname: string;
  lastname: string;
  email: string;
  image_url: string;
};

export async function getAdminMyProfile(): Promise<AdminMyProfile> {
  const json = await adminFetch<ApiSuccess<AdminMyProfile>>("/api/admin/", {
    method: "GET",
    auth: true,
  });
  return json.data;
}

export async function patchAdminProfile(input: {
  firstname?: string;
  lastname?: string;
  name?: string;
  imageFile?: File | null;
}): Promise<AdminMyProfile> {
  const { firstname, lastname, name, imageFile } = input;

  if (imageFile) {
    const fd = new FormData();
    if (firstname != null) fd.append("firstname", firstname);
    if (lastname != null) fd.append("lastname", lastname);
    if (name != null) fd.append("name", name);
    fd.append("file", imageFile);
    const json = await adminFetch<ApiSuccess<AdminMyProfile>>("/api/admin/", {
      method: "PATCH",
      auth: true,
      body: fd,
    });
    return json.data;
  }

  const json = await adminFetch<ApiSuccess<AdminMyProfile>>("/api/admin/", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({
      ...(firstname !== undefined ? { firstname } : {}),
      ...(lastname !== undefined ? { lastname } : {}),
      ...(name !== undefined ? { name } : {}),
    }),
  });
  return json.data;
}

export async function changeAdminPassword(body: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<void> {
  await adminFetch<ApiSuccess<unknown>>("/api/admin/change-password", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}
