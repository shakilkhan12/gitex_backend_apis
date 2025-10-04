import db from "@/prisma/client";

function getDateRange(range: string): { gte: Date; lte: Date } {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  switch (range) {
    case "daily":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = now;
      break;
    case "weekly":
      end = now;
      start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(start.setDate(diff));
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      end = now;
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = now;
      break;
  }
  return { gte: start, lte: end };
}

class AlertService {
  public static getAlertData = async (range: string) => {
    const { gte, lte } = getDateRange(range);

    const smokingAlerts = await db.parks_smoking_detection.findMany({
      where: {
        occurrence_date: {
          gte,
          lt: lte,
        },
      },
    });

    const litterAlerts = await db.parks_litter_detection.findMany({
      where: {
        detection_date: {
          gte,
          lt: lte,
        },
      },
    });

    const intrusionAlerts = await db.parks_intrusion_detection.findMany({
      where: {
        detection_date: {
          gte,
          lt: lte,
        },
      },
    });

    const behaviourAlerts = await db.parks_behaviour_alerts.findMany({
      where: {
        detection_date: {
          gte,
          lt: lte,
        },
      },
    });

    const fastMovingAlerts = behaviourAlerts.filter(
      (alert) => alert.detected_behaviour === "Fast Moving"
    );
    const fallingDownAlerts = behaviourAlerts.filter(
      (alert) => alert.detected_behaviour === "Fall Down"
    );
    const fightingAlerts = behaviourAlerts.filter(
      (alert) => alert.detected_behaviour === "Aggression"
    );

    return {
      alerts: [
        {
          type: "intrusion",
          totalAlerts: intrusionAlerts.length,
        },
        {
          type: "litter",
          totalAlerts: litterAlerts.length,
        },
        {
          type: "smoking",
          totalAlerts: smokingAlerts.length,
        },
        {
          type: "fast-moving",
          totalAlerts: fastMovingAlerts.length,
        },
        {
          type: "falling-down",
          totalAlerts: fallingDownAlerts.length,
        },
        {
          type: "fighting",
          totalAlerts: fightingAlerts.length,
        },
      ],
      total:
        smokingAlerts.length +
        litterAlerts.length +
        intrusionAlerts.length +
        fastMovingAlerts.length +
        fallingDownAlerts.length +
        fightingAlerts.length,
    };
  };
}

export default AlertService;
