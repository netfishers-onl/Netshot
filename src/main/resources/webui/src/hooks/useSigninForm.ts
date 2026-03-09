import { useForm } from "react-hook-form";

type SigninForm = {
  username: string;
  password: string;
  newPassword?: string;
};

export function useSigninForm() {
  return useForm<SigninForm>({
    defaultValues: {
      username: "",
      password: "",
    },
  });
}