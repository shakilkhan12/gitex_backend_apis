import { UsersRolesController } from "@/controllers";

import { Router } from "express";

const userRouter = Router();
userRouter.get('/get', UsersRolesController.getAllRolesWithUsers)
userRouter.post('/add',UsersRolesController.addUserNewRole)
userRouter.patch('/update/:roleId',UsersRolesController.updateUsersRole)

export default userRouter;
