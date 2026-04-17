import {
  ThresholdRuleRow,
  upsertThreshold,
} from "@/src/repos/local/thresholdRules.repo";
import { runSync } from "@/src/syncEngine/syncService";
import { useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import Toast from "react-native-toast-message";
import ThreshAction from "./ThreshAction";
import ThreshLabel from "./ThreshLabel";
import ThreshRange from "./ThreshRange";

const ThresholdRuleInput = ({ threshold }: { threshold: ThresholdRuleRow }) => {
  const [currThresh, setCurrThresh] = useState(threshold);

  const onSave = async () => {
    await upsertThreshold(currThresh);
    Toast.show({
      type: "success",
      text1: "threshold updated successfully",
    });
    await runSync();
  };

  return (
    <View style={{ gap: 5, paddingTop: 20, paddingBottom: 20 }}>
      <ThreshLabel
        label={currThresh.label}
        setThresholdLabel={(label) =>
          setCurrThresh((prev) => ({ ...prev, label }))
        }
      />
      <ThreshRange
        max={currThresh.maxValue}
        min={currThresh.minValue}
        setMax={(max) => setCurrThresh((prev) => ({ ...prev, maxValue: max }))}
        setMin={(min) => setCurrThresh((prev) => ({ ...prev, minValue: min }))}
      />
      {currThresh.actions?.map((action, index) => (
        <ThreshAction
          key={`action-${index}`}
          action={action}
          setAction={(action) => {
            const currActions = currThresh.actions;
            if (!currActions) return currThresh;
            currActions[index] = action;
            setCurrThresh((prev) => ({ ...prev, actions: currActions }));
          }}
        />
      ))}
      <Button uppercase mode="contained" onPress={onSave}>
        SAVE
      </Button>
    </View>
  );
};

export default ThresholdRuleInput;
