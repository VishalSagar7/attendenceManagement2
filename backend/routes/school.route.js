import express from 'express';
import School from '../models/school.model.js';
import { createSchool, createClass } from '../controllers/school.controller.js';

const router = express.Router();

router.post('/createschool', createSchool);
router.post('/createclass', createClass);

export default router;