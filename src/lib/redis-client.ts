import Redis from "ioredis";
const client = new Redis(
  "rediss://default:gQAAAAAAAjTmAAIgcDE4MDhhZGM4NzdlNWQ0MmMyYjFjNjNiYzAzY2ZjZWI3Yg@relaxing-feline-144614.upstash.io:6379",
);
export default client;
