export type StackNavigatorParamList = {
    Login: undefined;
    Home: undefined;
    Note: { title?: string; noteId?: string } | undefined;
    SignUp: undefined;
    Settings: { autoRecovery?: boolean; recoveryReason?: string } | undefined;
    SyncManagement: undefined;
};