const express = require("express");
const itemsController = require("../controller/itemsController");

const router = express.Router();

// router.get("/", itemsController.getItems);
router.get("/all_students", itemsController.getAllStudents);
router.get("/get_student", itemsController.getStudent);
router.post("/add_student", itemsController.addStudent);
router.delete("/delete_student", itemsController.deleteStudent);


// router.get("/get_tasks", itemsController.getTasks);
router.post("/add_task", itemsController.addTask);
router.delete("/delete_task", itemsController.deleteTask);

module.exports = router;