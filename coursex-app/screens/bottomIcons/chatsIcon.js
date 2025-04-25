import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

const ChatIcon = (props) => (

  <Svg width={30} height={30} viewBox="0 0 24 24" fill={props.color}>
    <Path d="M0 0h24v24H0z" fill="none" />
    <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </Svg>

);

const styles = StyleSheet.create({
  
});

export default ChatIcon;
