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
  }
});
