import { ParksController } from "@/controllers";
import { parkBasicInfoValidations, parkCameraValidations, parkValidations, zoneValidations } from "@/validations";
import { Router } from "express";
const parkRouter  = Router();
parkRouter.post('/add', parkValidations, ParksController.addPark)
parkRouter.post('/add-park-zone', zoneValidations, ParksController.addParkZone)
parkRouter.post('/add-park-camera', parkCameraValidations, ParksController.addParkCamera)
parkRouter.put("/update-park-camera-function",ParksController.changeParkCameraFunctionality)
parkRouter.put('/update-park-camera-settings', ParksController.updateSetting)
parkRouter.put('/update-park-basic-info', parkBasicInfoValidations, ParksController.updateParkBasicInfo);
parkRouter.get('/get', ParksController.getParks)
parkRouter.get('/get/:parkId', ParksController.getPark)
parkRouter.get('/get-park-zones/:parkId', ParksController.getParkZones)
parkRouter.get('/get-park-cameras/:parkId', ParksController.getParkCameras)
parkRouter.get('/get-park-setting/:parkId', ParksController.getParkSetting)
parkRouter.get('/get-park-cameras-functionalities/:parkId', ParksController.getParkCamerasFunctionalities)
export default parkRouter;