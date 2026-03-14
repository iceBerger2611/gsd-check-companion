import { DecisionType, FollowupType } from "@/db/schema";
import { ReadingPlan } from "./readings";

export const resolveNextFollowupPlan = (
  plan: ReadingPlan,
  earlyDecision?: DecisionType,
): { type: FollowupType; minutes: number } => {
  if (earlyDecision) {
    if (earlyDecision.type === "followup") {
      return {
        type: earlyDecision.followupType,
        minutes: earlyDecision.followupDelay,
      };
    }
    return {
      type:
        earlyDecision.intervention === "consume_glucose"
          ? "recheck"
          : "drink_cornstarch",
      minutes: earlyDecision.intervention === "consume_glucose" ? 10 : 30,
    };
  }
  return {
    type: plan.nexFollowup.type,
    minutes: plan.nexFollowup.delayMinutes,
  };
};
