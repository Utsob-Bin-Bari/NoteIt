export const LogOut = "LogOut" as const;

export const logOut = () => ({
  type: LogOut,
} as const);

export type LogOutAction = ReturnType<typeof logOut>;