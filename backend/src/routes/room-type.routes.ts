import { Router } from 'express';
import * as roomTypeController from '../controllers/room-type.controller';
import { validate } from '../middleware/validate.middleware';
import { createRoomTypeSchema, updateRoomTypeSchema } from '../validations/room-type.validation';

const router = Router();

router.post('/', validate(createRoomTypeSchema), roomTypeController.createRoomType);
router.get('/', roomTypeController.listRoomTypes);
router.get('/:id', roomTypeController.getRoomType);
router.put('/:id', validate(updateRoomTypeSchema), roomTypeController.updateRoomType);
router.delete('/:id', roomTypeController.deleteRoomType);

export default router;
