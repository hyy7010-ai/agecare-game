import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { DashboardContainer } from "./DashboardContainer";
import { ResidentCompanion } from "./ResidentCompanion";

export function RoleHome() {
  const { userProfile } = useAuth();
  return userProfile?.role === "resident" ? <ResidentCompanion /> : <DashboardContainer />;
}
