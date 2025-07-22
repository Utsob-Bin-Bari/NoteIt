import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { RootState } from '../../domain/types/store/RootState';
import { AuthState } from '../../domain/types/store/AuthState';
import { fetchLocalUserSession } from '../../application/services/user';
import { logoutUser } from '../../application/services/auth';
import { logOut } from '../../application/store/action/auth/logOut';
import { setSelectedNoteId } from '../../application/store/action/notes/setSelectedNoteId';

interface ExtendedUserSessionData extends AuthState {
  createdAt?: string;
  updatedAt?: string;
  lastSyncAt?: string;
}

export const useHome = () => {
  const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
  const dispatch = useDispatch();
  
  const reduxUserData = useSelector((state: RootState) => state.auth);
  
  const [localUserData, setLocalUserData] = useState<ExtendedUserSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);

  useEffect(() => {
    loadLocalUserData();
  }, []);

  const loadLocalUserData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await fetchLocalUserSession();
      
      if (result.success && result.data) {
        setLocalUserData(result.data);
      } else {
        setError(result.error || 'Failed to load local user data');
      }
    } catch (error) {
      setError('Something went wrong while loading user data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    
    try {
      const result = await logoutUser();
      
      dispatch(logOut());
      
      setLocalUserData(null);
      setError('');
      
      navigation.navigate('Login');
      
    } catch (error) {
      setError('Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const navigateToNote = (note?: any) => {
    if (note) {
      dispatch(setSelectedNoteId(note.id));
      navigation.navigate('Note', { title: note.title, noteId: note.id });
    } else {
      dispatch(setSelectedNoteId(''));
      navigation.navigate('Note');
    }
  };

  const handleAddNote = () => {
    dispatch(setSelectedNoteId(''));
    navigation.navigate('Note');
  };

  const handleToggleView = (isBookmarks: boolean) => {
    setShowBookmarks(isBookmarks);
  };

  const refreshUserData = () => {
    loadLocalUserData();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user data
      await loadLocalUserData();
      // The individual components (AllNotesComponent and AllBookmarksComponent) 
      // will handle their own data refresh through their internal RefreshControl
    } catch (error) {
      console.error('Error refreshing home data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleFilterToggle = () => {
    setIsFilterActive(prev => !prev);
    // Clear search when toggling filter
    if (searchQuery) {
      setSearchQuery('');
    }
  };

  const isLoggedIn = !!(reduxUserData?.id || localUserData?.id);

  return {
    reduxUserData,
    localUserData,
    isLoggedIn,
    loading,
    error,
    loggingOut,
    showBookmarks,
    refreshing,
    searchQuery,
    isFilterActive,
    navigateToNote,
    handleAddNote,
    handleToggleView,
    refreshUserData,
    handleRefresh,
    handleLogout,
    handleSettings,
    handleSearchChange,
    clearSearch,
    handleFilterToggle,
  };
}; 