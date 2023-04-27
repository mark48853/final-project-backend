const dotenv = require("dotenv");
dotenv.config();
const { v4: uuidv4 } = require("uuid");
const { unmarshallItem } = require("@aws-sdk/util-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DeleteCommand, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = new DynamoDBClient({ region: "us-east-1", removeUndefinedValues: true, marshallOptions: { convertEmptyValues: true } });


// add new tasks
exports.addTask = async (req, res) => {
  const task_id = uuidv4();
  const created_date = Date.now();
  const owner = String(req.param("student_id"));

  const task = {
    task_id: { S: task_id },
    task_name: { S: req.param("task_name") ?? "-" },
    task_subject: { S: req.param("task_subject") ?? "-" },
    task_details: { S: req.param("task_details") ?? "-" },
    created_date: { N: String(created_date) },
    deadline: { N: req.param("deadline") ?? 0 },
    color: { S: req.param("color") ?? "#FFFFFF" },
  };

  const params = {
    TableName: process.env.aws_students_table_name,
    Key: {
      "student_id": { S: owner }
    },
    UpdateExpression: "SET #tasks = list_append(#tasks, :task)",
    ExpressionAttributeNames: { "#tasks": "tasks" },
    ExpressionAttributeValues: {
      ":task": {
        L: [{
          M: task
        }]
      }
    }
  };

  const command = new UpdateItemCommand(params);

  docClient.send(command)
    .then(data => {
      console.log("UpdateItem succeeded:", data);
      res.send(task_id);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send(error);
    });
};


// delete task of a specific student
exports.deleteTask = async (req, res) => {
  const task_id = String(req.param("task_id"));
  const owner = String(req.param("student_id"));

  const getItemParams = {
    TableName: process.env.aws_students_table_name,
    Key: {
      "student_id": { S: owner }
    }
  };

  const getItemCommand = new GetItemCommand(getItemParams);

  try {
    const { Item: student } = await docClient.send(getItemCommand);

    if (!student) {
      res.status(404).send("Student not found.");
      return;
    }

    const tasks = student.tasks?.L || [];
    const taskIndex = tasks.findIndex(task => task.M.task_id.S === task_id);

    if (taskIndex === -1) {
      res.status(404).send("Task not found.");
      return;
    }

    const deleteParams = {
      TableName: process.env.aws_students_table_name,
      Key: {
        "student_id": { S: owner }
      },
      UpdateExpression: `REMOVE #tasks[${taskIndex}]`,
      ExpressionAttributeNames: { "#tasks": "tasks" },
      ReturnValues: "ALL_NEW"
    };

    const deleteCommand = new UpdateItemCommand(deleteParams);

    const { Attributes: updatedStudent } = await docClient.send(deleteCommand);

    res.send("task deleted");

  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

// get students list
exports.getAllStudents = async (req, res) => {
  const params = {
    TableName: process.env.aws_students_table_name,
  };
  try {
    const data = await docClient.send(new ScanCommand(params));
    res.send(data.Items);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

//get specific student
exports.getStudent = async (req, res) => {
  const params = {
    TableName: process.env.aws_students_table_name,
    Key: {
      student_id: { S: req.param("student_id") },
    },
  };
  try {
    const response = await docClient.send(new GetItemCommand(params));
    const item = response.Item;
    const unmarshalled = unmarshall(item);
    res.send(unmarshalled);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};


// add new student
exports.addStudent = async (req, res) => {
  const item = {
    student_id: req.param("student_id"),
    name: req.param("name"),
    tasks: [],
  };
  const params = {
    TableName: process.env.aws_students_table_name,
    Item: item,
    ConditionExpression: "attribute_not_exists(student_id)",
  };


  try {
    const data = await docClient.send(new PutCommand(params));
    res.send("user added!");
  } catch (err) {
    console.error("error occured");
    res.status(500).send(err);
  }
};


// delete student
exports.deleteStudent = async (req, res) => {
  const student_id = req.param("student_id");
  const params = {
    TableName: process.env.aws_students_table_name,
    Key: {
      'student_id': student_id
    }
  };


  try {
    const data = await docClient.send(new DeleteCommand(params));
    res.send("student deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};
