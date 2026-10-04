import { Router } from "express";
import { healthCheck } from "../controllers/healthCheckController.js";

const router = Router();

router.route("/").get(healthCheck);

export { router };

/**
 * Browser / Postman
        │
        │ GET /api/v1/healthcheck/
        ▼
      Express
        │
        │ matches /api/v1/healthcheck
        ▼
      router
        │
        │ matches /
        ▼
   healthCheck()
        │
        ▼
     response
 */
