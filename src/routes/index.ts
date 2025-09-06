import { Router } from "express";
import parkRouter from "./park.routes";
import smokingDetectionRouter from "./smoking-detection.routes";
import litterDetectionRouter from "./litter-detection.routes";
import landscapingRouter from "./landscaping.routes";
import behaviorAlertsRouter from "./behavior-alerts.routes";
import officeSentimentAnalysisRouter from "./office-sentiment-analysis.routes";
import parkSentimentAnalysisRouter from "./park-sentiment-analysis.routes";
import officeAttendanceRouter from "./office-attendance.routes";
import parkAttendanceRouter from "./park-attendance.routes";
import userRouter from "./user.routes";
import accessSecretRouter from "./access-secret.routes";
import usersRoles from "./users_roles.route";

const mainRouter = Router();

mainRouter.use('/parks', parkRouter)
mainRouter.use('/smoking-detection', smokingDetectionRouter)
mainRouter.use('/litter-detection', litterDetectionRouter)
mainRouter.use('/landscaping', landscapingRouter)
mainRouter.use('/behavior-alerts', behaviorAlertsRouter)
mainRouter.use('/office-sentiment-analysis', officeSentimentAnalysisRouter)
mainRouter.use('/park-sentiment-analysis', parkSentimentAnalysisRouter)
mainRouter.use('/office-attendance', officeAttendanceRouter)
mainRouter.use('/park-attendance', parkAttendanceRouter)
mainRouter.use('/users', userRouter)
mainRouter.use('/access-secret', accessSecretRouter)
mainRouter.use('/users-roles', usersRoles)

export default mainRouter;