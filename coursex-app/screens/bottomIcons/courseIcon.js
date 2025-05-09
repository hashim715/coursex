import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

const CourseIcon = (props) => (

    <Svg viewBox="0 0 24 24" width={24} height={24}>
    <Path d="M0 0h24v24H0z" fill="none">
    </Path>
    <Path fill="yellow" d="M18.41 5.8 17.2 4.59c-.78-.78-2.05-.78-2.83 0l-2.68 2.68L3 15.96V20h4.04l8.74-8.74 2.63-2.63c.79-.78.79-2.05 0-2.83zM6.21 18H5v-1.21l8.66-8.66 1.21 1.21L6.21 18zM11 20l4-4h6v4H11z">
    </Path>
    </Svg>

);

const styles = StyleSheet.create({
  
});

export default CourseIcon;
