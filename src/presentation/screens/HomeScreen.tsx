import React, { useContext, useLayoutEffect } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { GlobalStyles } from '../styles/GlobalStyles';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { useHome } from '../hooks/useHome';
import { getColors } from '../constants/Colors';
import { getHomeHeaderOptions } from '../styles/CustomHeaderStyle';
import ToggleSwitch from '../components/ToggleSwitch';
import SearchInput from '../components/SearchInput';
import AllNotesComponent from '../components/AllNotesComponent';
import AllBookmarksComponent from '../components/AllBookmarksComponent';
import { RootState } from '../../domain/types/store/RootState';

const HomeScreen = ({ navigation }: any) => {
  const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
  const colors = getColors(theme);
  const notesData = useSelector((state: RootState) => state.notes?.data);
  const bookmarksData = useSelector((state: RootState) => state.bookmarks?.data);
  const notesCount = Array.isArray(notesData) ? notesData.length : 0;
  const bookmarksCount = Array.isArray(bookmarksData) ? bookmarksData.length : 0;
  
  const {
    reduxUserData,
    localUserData,
    isLoggedIn,
    loading,
    showBookmarks,
    loggingOut,
    refreshing,
    searchQuery,
    isFilterActive,
    handleAddNote,
    handleToggleView,
    handleLogout,
    handleSettings,
    handleRefresh,
    handleSearchChange,
    clearSearch,
    handleFilterToggle,
    navigateToNote,
  } = useHome();

  useLayoutEffect(() => {
    const headerOptions = getHomeHeaderOptions(theme, toggleTheme, handleLogout, handleAddNote, handleSettings, loggingOut);
    navigation.setOptions(headerOptions);
  }, [navigation, theme, toggleTheme, handleLogout, handleAddNote, handleSettings, loggingOut]);

  if (loading) {
    return (
      <SafeAreaView style={GlobalStyles(theme).mainContainer}>
        <View style={[GlobalStyles(theme).container, GlobalStyles(theme).loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[GlobalStyles(theme).text, GlobalStyles(theme).loadingText]}>Loading user data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={GlobalStyles(theme).mainContainer}>
        <View style={[GlobalStyles(theme).container, { width: '90%' }]}>
          <SearchInput
            stylesProps={{marginBottom:10}}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search notes by title"
            isFilterActive={isFilterActive}
            onFilterPress={handleFilterToggle}
          />
          <ToggleSwitch
            leftOption={`All Notes (${notesCount})`}
            rightOption={`Bookmarks (${bookmarksCount})`}
            isRightSelected={showBookmarks}
            onToggle={handleToggleView}
          />

          {showBookmarks ? (
              <AllBookmarksComponent 
                navigation={navigation} 
                searchQuery={searchQuery} 
                isFilterActive={isFilterActive}
              />
            ) : (
              <AllNotesComponent 
                navigation={navigation} 
                searchQuery={searchQuery} 
                isFilterActive={isFilterActive}
              />
            )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default HomeScreen;