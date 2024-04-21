import { User } from "@/types";
import httpClient from "./httpClient";

export type UpdateUserPayload = {
  username: string;
  password: string;
  newPassword: string;
};

async function me() {
  return httpClient.get<User>("/user");
}

async function update(id: number, payload: UpdateUserPayload) {
  return httpClient.put<User, UpdateUserPayload>(`/user/${id}`, payload);
}

export default {
  me,
  update,
};
