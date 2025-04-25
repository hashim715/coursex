import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

const YoutubeIcon = (props) => (
  <Svg viewBox="0 0 24 24" width={24} height={24}>
  <Path d="M0 0h24v24H0V0z" fill="none">
  </Path>
  <Path fill="#ff3b30" d="M21 3H3c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5a2 2 0 0 0-2-2zm0 14H3V5h18v12zm-5-6-7 4V7z">
  </Path>
  </Svg>  

);

const styles = StyleSheet.create({
  
});

export default YoutubeIcon;
