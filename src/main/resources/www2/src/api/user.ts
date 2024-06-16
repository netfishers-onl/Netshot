import { User } from "@/types";
import httpClient from "./httpClient";
import { UpdateUserPayload } from "./types";

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
