import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

const DiscoverIcon = (props) => (

    <Svg viewBox="0 0 24 24" width={24} height={24} fill={props.color}>
        <Path d="M0 0h24v24H0z" fill="none" />
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    </Svg>

);

const styles = StyleSheet.create({
});

export default DiscoverIcon;
