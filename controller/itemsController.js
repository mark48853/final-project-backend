const dotenv = require("dotenv");
dotenv.config();
const { v4: uuidv4 } = require("uuid");
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DeleteCommand, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = new DynamoDBClient({ region: "us-east-1", removeUndefinedValues: true });

// add new tasks
exports.addTask = async (req, res) => {
  const task_id = uuidv4();
  const created_date = Date.now();
  const owner = String(req.param("student_id"));

  const task = {
    task_id: { S: task_id },
    task_name: { S: req.param("task_name") ?? "-" },
    task_details: { S: req.param("task_details") ?? "-" },
    created_date: { N: String(created_date) },
    deadline: { N: req.param("deadline") ?? 0 },
    color: { S: req.param("color") ?? "#FFFFFF" },
  };

  console.log(task);


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
      res.send("update succeed!");
    })
    .catch(error => {
      console.error(error);
      res.status(500).send(error);
    });
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
    const data = await docClient.send(new GetItemCommand(params));
    res.send(data.Item);
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
