import { NavigationContainerRef } from '@react-navigation/native';
import { StackNavigatorParamList } from '../../presentation/navigation/types/StackNavigator';

class NavigationService {
  private navigationRef: React.RefObject<NavigationContainerRef<StackNavigatorParamList>> | null = null;

  setNavigationRef(ref: React.RefObject<NavigationContainerRef<StackNavigatorParamList>>) {
    this.navigationRef = ref;
  }

  navigate<RouteName extends keyof StackNavigatorParamList>(
    routeName: RouteName,
    params?: StackNavigatorParamList[RouteName]
  ) {
    if (this.navigationRef?.current) {
      // @ts-ignore - NavigationContainer types are complex, using ignore for simplicity
      this.navigationRef.current.navigate(routeName, params);
    } else {
      console.warn('Navigation ref is not set. Cannot navigate.');
    }
  }

  goBack() {
    if (this.navigationRef?.current) {
      this.navigationRef.current.goBack();
    } else {
      console.warn('Navigation ref is not set. Cannot go back.');
    }
  }

  reset(state: any) {
    if (this.navigationRef?.current) {
      this.navigationRef.current.reset(state);
    } else {
      console.warn('Navigation ref is not set. Cannot reset.');
    }
  }

  getCurrentRoute() {
    if (this.navigationRef?.current) {
      return this.navigationRef.current.getCurrentRoute();
    }
    return null;
  }
}

export const navigationService = new NavigationService();
export default navigationService; 