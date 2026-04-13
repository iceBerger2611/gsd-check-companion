import { useState } from "react";
import { TextInput } from "react-native-paper";

const ThreshLabel = ({
  label,
  setThresholdLabel,
}: {
  label: string | null;
  setThresholdLabel: (label: string | null) => void;
}) => {
  const [currlabel, setCurrLabel] = useState(label);

  const onChange = (label: string) => {
    setCurrLabel(label);
    setThresholdLabel(label);
  };

  return (
    <TextInput
      label="label"
      placeholder="enter your threshold label"
      mode="outlined"
      value={currlabel || undefined}
      onChangeText={onChange}
    />
  );
};

export default ThreshLabel;
