export const SetUserInfo = "SetUserInfo" as const;
import { AuthState } from "../../../../domain/types/store";

export const setUserInfo = (userInfo: AuthState) => ({
  type: SetUserInfo,
  payload: userInfo,
} as const);

export type SetUserInfoAction = ReturnType<typeof setUserInfo>;