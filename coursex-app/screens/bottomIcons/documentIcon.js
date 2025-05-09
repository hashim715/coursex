import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

const DocumentIcon = (props) => (

  <Svg viewBox="0 0 24 24" width={24} height={24}>
  <Path d="M0 0h24v24H0V0z" fill="none">
  </Path>
  <Path fill="#4cd964" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11z">
  </Path>
  </Svg>

);

const styles = StyleSheet.create({
  
});

export default DocumentIcon;
