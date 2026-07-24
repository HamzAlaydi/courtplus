import { useMutation } from "@tanstack/react-query";
import {
  checkUsernameService,
  loginService,
  sendCodeService,
  signupService,
  socialLoginService,
} from "./auth.service";

export const useLoginMutation = () => {
  const { mutateAsync } = useMutation({
    mutationFn: loginService,
  });
  return {
    loginMutation: mutateAsync,
  };
};

export const useSendCodeMutation = () => {
  const { mutateAsync } = useMutation({
    mutationFn: sendCodeService,
  });
  return {
    sendCodeMutation: mutateAsync,
  };
};

export const useSocialLoginMutation = () => {
  const { mutateAsync } = useMutation({
    mutationFn: socialLoginService,
  });
  return {
    mutateAsync,
  };
};

export const useCheckUsernameMutation = () => {
  const { mutateAsync } = useMutation({
    mutationFn: checkUsernameService,
  });
  return {
    checkUsernameMutation: mutateAsync,
  };
};

export const useSignupMutation = () => {
  const { mutateAsync } = useMutation({
    mutationFn: signupService,
  });
  return {
    signupMutation: mutateAsync,
  };
};
