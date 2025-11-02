import { env } from "@/env";

const loggerConfig =
  env.NODE_ENV === "test"
    ? false
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
      };

export { loggerConfig };
