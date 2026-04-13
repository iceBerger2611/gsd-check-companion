import supabase from "@/lib/supabase";
import { listSupervisorCareLinks } from "@/repos/local/careLinks.repo";
import { getProfileByIdSafe, ProfileRow } from "@/repos/local/profiles.repo";
import { upsertReading } from "@/repos/local/readings.repo";
import { Database } from "@/types/database.types";
import { Profile } from "@/types/tables.types";
import { Session, User } from "@supabase/supabase-js";
import { identifySupabaseError } from "./utils";

interface AuthInRes {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
}

export const handleCatch = (error: unknown) => {
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
    } = await supabase.auth.signUp({ email, password, options: {} });

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

export const GetPatientsOfSupervisor = async (supervisorId: string) => {
  try {
    const careLinks = await listSupervisorCareLinks(supervisorId);
    const results = await Promise.allSettled(
      Array.from(
        { length: careLinks.length },
        (_, index) =>
          careLinks[index].patientId &&
          getProfileByIdSafe(careLinks[index].patientId),
      ),
    );
    const patients: ProfileRow[] = [];
    results.forEach((promise) => {
      if (promise.status === "fulfilled" && promise.value) {
        patients.push(promise.value);
      }
    });
    return patients;
  } catch (error) {
    return handleCatch(error);
  }
};

export const InsertNewReading = async (
  reading: Database["public"]["Tables"]["readings"]["Insert"],
) => {
  try {
    const { status, data } = await supabase
      .from("readings")
      .insert(reading)
      .single();
    const res = await supabase
      .from("readings")
      .select("*")
      .eq("id", data?.["id"] as unknown as string)
      .single();
    await upsertReading({ ...reading, id: res.data?.id || "new" });
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
