import { UserController } from "@/controllers";
import { userLoginValidations, addUserValidations } from "@/validations";
import { Router } from "express";

const userRouter = Router();
userRouter.post('/login', userLoginValidations, UserController.login)
userRouter.get('/get',UserController.getUsers)
userRouter.get('/filters', UserController.getUsersFilters)
userRouter.get('/visitors', UserController.getVisitors)
userRouter.post('/visitors/delete', UserController.deleteVisitorUser)
userRouter.post('/get-details', UserController.getUserDetails)
userRouter.put('/update/role/:userId',UserController.updateUserRole)
userRouter.post('/fetch-employees', UserController.fetchAndStoreEmployeeListing);
userRouter.post('/fetch-employees-progress', UserController.fetchAndStoreEmployeeListingWithProgress);
userRouter.post('/add', addUserValidations, UserController.addUser)
userRouter.post('/sync-to-hikvision', UserController.syncUsersWithoutUniqueIdToHikVision)

export default userRouter;
