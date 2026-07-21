import { Router } from 'express';
import * as roomTypeController from '../controllers/room-type.controller';
import { validateRequest } from '../middleware/validate-request';
import { createRoomTypeSchema, updateRoomTypeSchema } from '../validations/room-type.validation';

const router = Router();

router.post('/', validateRequest(createRoomTypeSchema), roomTypeController.createRoomType);
router.get('/', roomTypeController.listRoomTypes);
router.get('/:id', roomTypeController.getRoomType);
router.put('/:id', validateRequest(updateRoomTypeSchema), roomTypeController.updateRoomType);
router.delete('/:id', roomTypeController.deleteRoomType);

export default router;
