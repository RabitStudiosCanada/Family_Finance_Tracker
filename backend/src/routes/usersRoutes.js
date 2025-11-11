const { Router } = require('express');

const usersController = require('../controllers/usersController');
const validateRequest = require('../middleware/validateRequest');
const {
  listUsersSchema,
  getUserSchema,
  createUserSchema,
  updateUserSchema,
  archiveUserSchema,
  resetPasswordSchema,
} = require('../schemas/userSchemas');

const router = Router();

router.get('/', validateRequest(listUsersSchema), usersController.listUsers);
router.post('/', validateRequest(createUserSchema), usersController.createUser);
router.get('/:id', validateRequest(getUserSchema), usersController.getUser);
router.put('/:id', validateRequest(updateUserSchema), usersController.updateUser);
router.delete('/:id', validateRequest(archiveUserSchema), usersController.archiveUser);
router.patch('/:id/password', validateRequest(resetPasswordSchema), usersController.resetPassword);

module.exports = router;
