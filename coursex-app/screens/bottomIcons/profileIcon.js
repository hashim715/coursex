import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

const ProfileIcon = (props) => (
    <Svg width={24} height={24} viewBox="0 0 512 512">
        <Path 
            d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 128c39.77 0 72 32.24 72 72S295.8 272 256 272c-39.76 0-72-32.24-72-72S216.2 128 256 128zM256 448c-52.93 0-100.9-21.53-135.7-56.29C136.5 349.9 176.5 320 224 320h64c47.54 0 87.54 29.88 103.7 71.71C356.9 426.5 308.9 448 256 448z" 
            fill={props.color} // Set the fill color using props.color
        />
    </Svg>

);

const styles = StyleSheet.create({
});

export default ProfileIcon;
