import Socket from "ws";
import { Request, Requests, Response, Responses } from "@shared/message";
import { Logger, LoggerMode, _throw, _try } from "@shared/utilities";

type Handlers = {
  [K in Request]: (
    request: Requests[K]
  ) => K extends Response ? Responses[K] : void;
};

const wrapLogger = (log: Logger, remoteAddress: string): Logger => (
  s: string,
  mode?: LoggerMode
) => log(`${remoteAddress} > ${s}`, mode);

const configureHandlers = (socket: Socket, log: Logger, handlers: Handlers) => {
  socket.on("message", (raw) => {
    _throw(
      "Message was not sent as a Buffer",
      "internal",
      !(raw instanceof Buffer)
    );

    const requestString = raw.toString();
    log(`Received ${requestString}.`);

    const request = _try(
      () => JSON.parse(requestString),
      () => _throw("Invalid request.", "external")
    );

    const response = handlers[request.name as Request](request); // TODO: make safe

    if (response) {
      const responseString = JSON.stringify(response);
      log(`Sending ${responseString}.`);
      socket.send(responseString);
    }
  });
};

const configureLogging = (socket: Socket, log: Logger) => {
  log("Connection established.");
  socket.on("message", () => log("Message received."));
  socket.on("error", (err) => log(`Error occurred, ${err.message}.`, "bad"));
  socket.on("close", () => log("Connection closed."));
};

const createServer = (port: number, handlers: Handlers, log?: Logger) => {
  const server = new Socket.Server({ port });

  server.on("connection", (socket, { socket: { remoteAddress } }) => {
    const logger = log ? wrapLogger(log, remoteAddress ?? "") : () => void 0;

    configureLogging(socket, logger);
    configureHandlers(socket, logger, handlers);
  });
};

export { createServer, Logger, Handlers };