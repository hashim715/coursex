import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

const Dropdown = () => {
  const [selectedValue, setSelectedValue] = useState("");

  return (
    <View style={{ marginBottom: 8, marginTop: 13 }}>
      <Text style={styles.field}>school/college</Text>
      <View style={styles.dropdown}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue, itemIndex) => setSelectedValue(itemValue)}
          style={styles.picker}
          placeholder="What school/college is the groupchat part of?"
        >
          <Picker.Item label="Select a school/college" value="" />
          <Picker.Item label="School 1" value="school1" />
          <Picker.Item label="School 2" value="school2" />
          <Picker.Item label="School 3" value="school3" />
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    fontSize: 16,
    color: "black",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f5f6fa",
    paddingHorizontal: 10,
  },
  picker: {
    height: 40,
    color: "black",
  },
});

export default Dropdown;
