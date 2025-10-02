import { Router } from "express";
import smokingDetectionRouter from "./smoking-detection.routes";
import intrusionDetectionRouter from "./intrusion-detection.routes";
import litterDetectionRouter from "./litter-detection.routes";
import landscapingRouter from "./landscaping.routes";
import irrigationsRouter from "./irrigations.routes";
import behaviorAlertsRouter from "./behavior-alerts.routes";
import officeSentimentAnalysisRouter from "./office-sentiment-analysis.routes";
import parkSentimentAnalysisRouter from "./park-sentiment-analysis.routes";
import officeAttendanceRouter from "./office-attendance.routes";
import parkAttendanceRouter from "./park-attendance.routes";
import userRouter from "./user.routes";
import accessSecretRouter from "./access-secret.routes";
import usersRoles from "./users_roles.route";

import parksRouter from "./parks.routes";
import officesRouter from "./offices.routes";
import settingsRouter from "./settings.routes";
import eventHandlerRouter from "./event-handler.routes";
import handlingImagesRouter from "./handling-images.routes";
import intranetPostingHistoryRouter from "./intranet-posting-history.routes";
import camerasRouter from "./cameras.routes";
import dashboardRouter from "./dashboard.routes";
const mainRouter = Router();

mainRouter.use('/dashboard', dashboardRouter)
mainRouter.use('/smoking-detection', smokingDetectionRouter)
mainRouter.use('/intrusion-detection', intrusionDetectionRouter)
mainRouter.use('/litter-detection', litterDetectionRouter)
mainRouter.use('/landscaping', landscapingRouter)
mainRouter.use('/irrigations', irrigationsRouter)
mainRouter.use('/behavior-alerts', behaviorAlertsRouter)
mainRouter.use('/office-sentiment-analysis', officeSentimentAnalysisRouter)
mainRouter.use('/park-sentiment-analysis', parkSentimentAnalysisRouter)
mainRouter.use('/office-attendance', officeAttendanceRouter)
mainRouter.use('/park-attendance', parkAttendanceRouter)
mainRouter.use('/users', userRouter)
mainRouter.use('/access-secret', accessSecretRouter)
mainRouter.use('/users-roles', usersRoles)

mainRouter.use('/parks', parksRouter)
mainRouter.use('/offices', officesRouter)
mainRouter.use('/settings', settingsRouter)
mainRouter.use('/event-handler', eventHandlerRouter)
mainRouter.use('/handling-images', handlingImagesRouter)
mainRouter.use('/intranet-posting-history', intranetPostingHistoryRouter)
mainRouter.use('/cameras', camerasRouter)

export default mainRouter;