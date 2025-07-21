import { AuthState } from "../../../../domain/types/store";
import { SetUserInfo, SetUserInfoAction } from "../../action/auth/setUserInfo";
import { LogOut, LogOutAction } from "../../action/auth/logOut";
import { authInitialState } from "../../initialState";

type AuthAction = SetUserInfoAction | LogOutAction;

export const authReducer = (state: AuthState = authInitialState, action: AuthAction) => {
  switch (action.type) {
    case SetUserInfo:
      return action.payload;
    case LogOut:
      return authInitialState;
    default:
      return state;
  }
};
