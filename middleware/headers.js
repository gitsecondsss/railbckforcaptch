import helmet from "helmet";

export default helmet({
  contentSecurityPolicy: false, // adjust if needed
  crossOriginResourcePolicy: { policy: "cross-origin" }
});
