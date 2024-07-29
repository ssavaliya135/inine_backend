import express, { Router } from 'express';
import { getAllUserAdminController } from '../../controllers/admin/user.controller';

const adminUserRoute: Router = express.Router();

adminUserRoute.get("/", getAllUserAdminController);

export default adminUserRoute;