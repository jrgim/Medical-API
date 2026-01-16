import { merge } from "lodash";
import { development } from "./development";

const all = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  ip: process.env.IP || "0.0.0.0",
  user_sessions: {
    secret:
      process.env.JWT_SECRET ||
      "rgdj22qh323gfydda.1ej,pg3dfa.hrjf489dh24a.435.23.hospital",
    expiration_days: 7,
    max_active_sessions: 4,
  },
  dbOptions: {
    database: "hospital.db",
  },
};

export const config: any = merge(all, _getEnvironmentConfig());

function _getEnvironmentConfig() {
  if (process.env.NODE_ENV === "test") {
    return test;
  } else if (process.env.NODE_ENV === "development") {
    return development;
  } else {
    return {};
  }
}