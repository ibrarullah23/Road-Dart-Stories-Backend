import express from 'express';
import { deleteUser, getAllUsers, getUser, updateUser } from './../controllers/userConstoller.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;