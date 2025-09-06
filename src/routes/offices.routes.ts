import { OfficesController } from "@/controllers";
import { officeBasicInfoValidations, officeValidations, validateOfficeCamera } from "@/validations";
import { Router } from "express";
const officesRouter  = Router();
officesRouter.post('/add',officeValidations, OfficesController.addOffice)
officesRouter.post('/add-office-camera', validateOfficeCamera, OfficesController.addOfficeCamera)
officesRouter.put("/update-office-camera-function",OfficesController.changeOfficeCameraFunctionality)
officesRouter.put('/update-office-setting', OfficesController.updateOfficeSetting)
officesRouter.put('/update-office-basic-info', officeBasicInfoValidations, OfficesController.updateOfficeBasicInfo);
officesRouter.put('/update-office-image', OfficesController.updateOfficeImage)
officesRouter.put('/update-office-camera/:id', validateOfficeCamera, OfficesController.updateOfficeCamera)
officesRouter.get('/get', OfficesController.getOffices)
officesRouter.get('/get-office/:office_Id', OfficesController.getOffice)
officesRouter.get('/get-office-cameras/:officeId', OfficesController.getOfficeCameras)
officesRouter.get('/get-office-setting/:officeId', OfficesController.getOfficeSetting)
officesRouter.get('/get-office-cameras-functionalities/:officeId', OfficesController.getOfficeCamerasFunctionalities)
export default officesRouter;