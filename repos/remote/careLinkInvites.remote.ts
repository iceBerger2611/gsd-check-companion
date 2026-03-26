import { AppError, mapDbError } from "@/db/errors";
import supabase from "@/lib/supabase";

export type CreateCareLinkInviteResponse = {
  inviteId: string;
  code: string;
  expiresAt: string;
};

export type ClaimCareLinkInviteResponse = {
  careLinkId: string;
  patientId: string;
  supervisorId: string;
};

export const createCareLinkInvite = async (
  expiryInMinutes: number,
): Promise<CreateCareLinkInviteResponse | AppError> => {
  try {
    const { data, error } = await supabase
      .rpc("create_care_link_invite", { p_expires_in_minutes: expiryInMinutes })
      .single();

    if (error) {
      throw error;
    }
    if (!data) throw new Error("No invite returned");

    return {
      inviteId: data.invite_id,
      code: data.code,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    return mapDbError(error, "failed to create care link invite");
  }
};

export const claimCareLinkInvite = async (
  inviteCode: string,
): Promise<ClaimCareLinkInviteResponse | AppError> => {
  try {
    const code = inviteCode.trim();

    if (!code) {
      throw new Error("Invite code is required");
    }

    const { data, error } = await supabase
      .rpc("claim_care_link_invite", { p_code: code })
      .single();

    if (error) {
      throw error;
    }
    if (!data) throw new Error("No invite claimed");

    return {
      careLinkId: data.care_link_id,
      patientId: data.patient_id,
      supervisorId: data.supervisor_id,
    };
  } catch (error) {
    return mapDbError(error, "failed to claim care link invite");
  }
};
