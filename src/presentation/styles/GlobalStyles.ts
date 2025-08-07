import { StyleSheet } from 'react-native';
import { getColors } from '../constants/Colors';
import { ThemeType } from '../../domain/types/theme/theme';
export const GlobalStyles = (theme: ThemeType) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems:'center',
    backgroundColor:getColors(theme).background,
  },
  container: {
    flex: 1,
    width: '80%',
    paddingVertical:20,
  },
  titleText:{
    color:getColors(theme).primary,
     fontSize: 32, 
     lineHeight:40,
     fontWeight: 'bold', 
     textAlign: 'center' 
  },
  text:{
    color:getColors(theme).text,
  },
  primaryText:{
    color:getColors(theme).primary,
    fontSize:18,
    lineHeight:20,
    fontWeight:'bold',
  },
  mediumText:{
    color:getColors(theme).text,
    fontSize:16,
    lineHeight:20,
    textAlign:'center',
    marginTop:20,
  },
  linkText:{
    color:getColors(theme).primary,
    fontSize:16,
    lineHeight:20,
    fontWeight:'bold',
    textAlign:'center',
    paddingHorizontal:10,
    marginTop:20,
  },
  rowContainer:{
    flexDirection:'row',
    justifyContent:'center',
  },
  errorText:{
    color: getColors(theme).error,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'left',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: getColors(theme).border,
    overflow: 'hidden',
    marginBottom:10,
  },
  toggleOption: {
    height: 40,
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  componentContainer: {
    backgroundColor: getColors(theme).secondary,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: getColors(theme).border,
    minHeight: 200,
  },
  componentTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  componentContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  componentSubText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  componentHintText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 10,
    fontSize: 14,
  },
  searchInputContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: getColors(theme).border,
    backgroundColor: getColors(theme).inputBackground,
    overflow: 'hidden',
    marginBottom: 10,
  },
  searchOrFilterIconContainer: {
    width: 50,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTextContainer:{
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    fontSize: 16,
    color: getColors(theme).text,
  }
});
