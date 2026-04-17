import { Action, FollowupType, Intervention } from "@/src/db/schema";
import { useState } from "react";
import { View } from "react-native";
import { TextInput } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

const ThreshAction = ({
  action,
  setAction,
}: {
  action: Action;
  setAction: (action: Action) => void;
}) => {
  const [currAction, setCurrAction] = useState(action);

  const onTypeChange = (type: "intervention" | "followup") => {
    const getNewAction = (): Action => {
      if (type === "followup") {
        return {
          type: "followup",
          followupDelay: 0,
          followupType: "recheck",
        };
      } else {
        return {
          type: "intervention",
          intervention: "eat_immediately",
        };
      }
    };

    setCurrAction(getNewAction());
    setAction(getNewAction());
  };

  const onFollowupTypeChange = (followupType: FollowupType) => {
    if (currAction.type === "followup") {
      setCurrAction((action) => ({ ...action, followupType }));
      setAction({ ...currAction, followupType });
    }
  };

  const onDelayChange = (followupDelay: string) => {
    if (currAction.type === "followup") {
      setCurrAction((action) => ({
        ...action,
        followupDelay: Number(followupDelay),
      }));
      setAction({
        ...currAction,
        followupDelay: Number(followupDelay),
      });
    }
  };

  const onInterventionChange = (intervention: Intervention) => {
    if (currAction.type === "intervention") {
      setCurrAction((action) => ({
        ...action,
        intervention,
      }));
      setAction({
        ...currAction,
        intervention,
      });
    }
  };

  return (
    <View style={{ gap: 5 }}>
      <Dropdown
        label="action type"
        value={currAction.type}
        onSelect={(value) => onTypeChange(value as "intervention" | "followup")}
        options={[
          { label: "intervention", value: "intervention" },
          { label: "followup", value: "followup" },
        ]}
      />
      {currAction.type === "followup" ? (
        <>
          <Dropdown
            label="followup type"
            value={currAction.followupType}
            onSelect={(value) => onFollowupTypeChange(value as FollowupType)}
            options={[
              { label: "recheck", value: "recheck" },
              { label: "drink cornstarch", value: "drink_cornstarch" },
            ]}
          />
          <TextInput
            label="delay"
            inputMode="numeric"
            placeholder="enter followup delay"
            mode="outlined"
            value={currAction.followupDelay.toString() || undefined}
            onChangeText={onDelayChange}
            style={{ height: 50 }}
          />
        </>
      ) : (
        <>
          <Dropdown
            label="intervention"
            value={currAction.intervention}
            onSelect={(value) => onInterventionChange(value as Intervention)}
            options={[
              { label: "consume glucose", value: "consume_glucose" },
              { label: "eat immediately", value: "eat_immediately" },
            ]}
          />
        </>
      )}
    </View>
  );
};

export default ThreshAction;
