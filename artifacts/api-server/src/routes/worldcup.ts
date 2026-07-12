import { Router, type IRouter } from "express";
import { getWorldCupFixtures, isConfigured } from "../lib/txline";

const router: IRouter = Router();

/**
 * Live World Cup fixtures from the TxLINE feed, normalised for the ticker.
 * Returns `{ configured: false }` (200) when no API token is set so the UI can
 * hide the ticker gracefully instead of erroring.
 */
router.get("/worldcup/fixtures", async (req, res): Promise<void> => {
  if (!isConfigured()) {
    res.json({ configured: false, matches: [] });
    return;
  }
  try {
    const matches = await getWorldCupFixtures();
    res.json({ configured: true, matches });
  } catch (err) {
    req.log?.error({ err, event: "txline_fixtures_failed" }, "TxLINE fixtures fetch failed");
    res.status(502).json({ configured: true, error: "Upstream TxLINE error.", matches: [] });
  }
});

export default router;
