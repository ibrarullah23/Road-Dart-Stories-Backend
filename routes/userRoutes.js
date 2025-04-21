import express from 'express';
import {  getAllUsers, getUser, updateUser } from './../controllers/userConstoller.js';
import { authMiddleware } from './../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.patch('/', authMiddleware, updateUser);
// router.delete('/:id',authMiddleware, deleteUser);

export default router;