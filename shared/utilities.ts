const _throw = (
  message: string,
  type: "internal" | "external",
  condition = true
) => {
  if (condition) {
    throw { message, type };
  }
};

const _try = <T = void>(f: () => T, _catch?: (e: unknown) => any) => {
  try {
    return f();
  } catch (e) {
    _catch?.(e);
  }

  return void 0;
};

type LoggerMode = "info" | "good" | "bad";
type Logger = (s: string, mode?: LoggerMode) => void;

type Named<T> = { name: T };

export { _throw, Logger, LoggerMode, Named, _try };