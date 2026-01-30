import { createServer } from "http";
import app from "../server/index";

const server = createServer(app);

export default server;
