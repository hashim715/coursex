import React from 'react';
import Svg, { Path } from 'react-native-svg';
import {StyleSheet } from 'react-native';

const RemoveIcon = (props) => (

    <Svg viewBox="0 0 24 24" width={15} height={15}>
    <Path d="M0 0h24v24H0z" fill="none"></Path>
    <Path fill="white" d="M19 13H5v-2h14v2z"></Path>
    </Svg>

);

const styles = StyleSheet.create({
  
});

export default RemoveIcon;
