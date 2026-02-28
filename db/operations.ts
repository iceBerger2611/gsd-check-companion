import supabase from "@/lib/supabase";

export const Register = async (email: string, password: string) => {
  try {
    const {
      data: { session, user },
    } = await supabase.auth.signUp({ email, password });
    return { session, user };
  } catch (error) {}
};

export const LogIn = async (email: string, password: string) => {
  try {
    const {
      data: { session, user },
    } = await supabase.auth.signInWithPassword({ email, password });
    return { session, user };
  } catch (error) {}
};

export const GetUserProfile = async (userId: string) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  } catch (error) {}
};

export const LinkSupervisorToPatient = async (
  supervisor_id: string,
  patient_id: string,
) => {
  try {
    const { status } = await supabase
      .from("care_links")
      .insert({ patient_id, supervisor_id, status: "active" });
    return status;
  } catch (error) {}
};

export const InsertNewReading = async (
  glucose_value: number,
  outcome: string,
  patient_id: string,
  recorded_at: string,
  unit: string,
) => {
  try {
    const { status } = await supabase.from("readings").insert({
      glucose_value,
      outcome,
      patient_id,
      recorded_at,
      unit,
    });
    return status;
  } catch (error) {}
};
