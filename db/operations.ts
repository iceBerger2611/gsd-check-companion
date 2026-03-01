import supabase from "@/lib/supabase";
import { Profile } from "@/types/tables.types";
import { Session, User } from "@supabase/supabase-js";
import { identifySupabaseError } from "./utils";

interface AuthInRes {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
}

const handleCatch = (error: unknown) => {
  const res = identifySupabaseError(error);
  const returnedError = Object.assign(
    new Error(res?.message || "Unknown Error"),
    {
      status: res?.status || 500,
    },
  );

  return returnedError as Error;
};

export const GetUserProfile = async (userId: string) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  } catch (error) {
    return handleCatch(error);
  }
};

export const Register = async (email: string, password: string) => {
  try {
    const res: AuthInRes = {
      profile: null,
      session: null,
      user: null,
    };

    const {
      data: { session, user },
    } = await supabase.auth.signUp({ email, password, options: {  } });

    res.session = session;
    res.user = user;

    if (user) {
      const profile = await GetUserProfile(user.id);
      if (profile instanceof Error) throw profile;
      res.profile = profile;
    }

    return res;
  } catch (error) {
    return handleCatch(error);
  }
};

export const LogIn = async (
  email: string,
  password: string,
): Promise<AuthInRes | Error> => {
  try {
    const res: AuthInRes = {
      profile: null,
      session: null,
      user: null,
    };

    const {
      data: { session, user },
    } = await supabase.auth.signInWithPassword({ email, password });

    res.session = session;
    res.user = user;

    if (user) {
      const profile = await GetUserProfile(user.id);
      if (profile instanceof Error) throw profile;
      res.profile = profile;
    }

    return res;
  } catch (error) {
    return handleCatch(error);
  }
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
  } catch (error) {
    return handleCatch(error);
  }
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
  } catch (error) {
    return handleCatch(error);
  }
};

export const updateProfileRole = async (
  id: string,
  role: "patient" | "supervisor",
) => {
  try {
    const { status } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);
    return status;
  } catch (error) {
    return handleCatch(error);
  }
};
