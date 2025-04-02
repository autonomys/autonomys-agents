import { Router } from 'express';
import { addTask, deleteTask, getTaskList, getTaskStream } from '../controller/TaskController.js';

export const createTasksRouter = (): Router => {
  const router = Router();

  router.get('/:namespace/tasks', getTaskList);
  router.post('/:namespace/addTask', addTask);
  router.delete('/:namespace/task/:taskId', deleteTask);
  router.get('/:namespace/taskStream', getTaskStream);

  return router;
};
