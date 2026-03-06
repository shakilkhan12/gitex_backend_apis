import { ParksController } from "@/controllers";
import { parkBasicInfoValidations, parkCameraValidations, parkValidations, updateZoneStatusValidation, zoneValidations } from "@/validations";
import { Router } from "express";
const parkRouter  = Router();
parkRouter.post('/add', parkValidations, ParksController.addPark)
parkRouter.post('/add-park-zone', zoneValidations, ParksController.addParkZone)
parkRouter.post('/add-park-camera', parkCameraValidations, ParksController.addParkCamera)
parkRouter.put("/update-park-camera-function",ParksController.changeParkCameraFunctionality)
parkRouter.put('/update-park-camera-settings', ParksController.updateSetting)
parkRouter.put('/update-park-basic-info', parkBasicInfoValidations, ParksController.updateParkBasicInfo);
parkRouter.put('/update-park-zone/:id', zoneValidations, ParksController.updateParkZone);
parkRouter.put('/update-park-camera/:id', parkCameraValidations, ParksController.updateParkCamera);
parkRouter.put('/update-park-image', ParksController.updateParkImage)
parkRouter.put('/update-park-status', updateZoneStatusValidation, ParksController.updateParkStatus)
parkRouter.get('/get', ParksController.getParks)
parkRouter.get('/get/:parkId', ParksController.getPark)
parkRouter.get('/get-park-zones/:parkId', ParksController.getParkZones)
parkRouter.get('/get-park-cameras/:parkId', ParksController.getParkCameras)
parkRouter.get('/get-park-setting/:parkId', ParksController.getParkSetting)
parkRouter.get('/get-park-cameras-functionalities/:parkId', ParksController.getParkCamerasFunctionalities)
parkRouter.get('/get-park-footfall-analysis/:park_Id', ParksController.getParkFootfallAnalysis)
parkRouter.post('/add-park-footfall-analysis', ParksController.addParkFootfallAnalysis)
parkRouter.get('/get-park-zones-job-history/:parkId', ParksController.getParkZonesJobHistory)
parkRouter.get('/get-park-zones-job-history/:parkId/export/excel', ParksController.exportParkZonesJobHistoryExcel)
parkRouter.get('/get-park-zones-job-history/:parkId/export/pdf', ParksController.exportParkZonesJobHistoryPdf)

export default parkRouter;