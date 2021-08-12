const figlet = require("figlet");
const mysql = require("mysql");
const inquirer = require("inquirer");
require("console.table");



const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Xjtlu2010!',
    database: 'empData'
});

const employee_ASC = figlet('Employees', function(err, data) {
  if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
  }
  console.log(data)
});

const manager_ASC = figlet('Manager', function(err, data) {
  if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
  }
  console.log(data)
});




connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    employee_ASC;
    manager_ASC;
    firstPrompt();
});


function firstPrompt() {
  inquirer
    .prompt({
      type: "list",
      name: "task",
      message: "Would you like to do?",
      choices: [
        "View All Employees",
        "View All Employees by Department",
        "View All Employees by Manager",
        "Add Employee",
        "Remove Employees",
        "Update Employee Role",
        "Update Employee Manager",
        "View All Roles",
        "Add Role",
        "End"]
    })
    .then(function ({ task }) {
      switch (task) {
        case "View All Employees":
          viewEmployee();
          break;

        case "View All Employees by Department":
          viewEmployeeByDepartment();
          break;

        case "View All Employees by Manager":
          viewEmployeeByManager();
          break;          
      
        case "Add Employee":
          addEmployee();
          break;

        case "Remove Employees":
          removeEmployee();
          break;

        case "Update Employee Role":
          remove('role');
          break;

        case "Update Employee Manager":
          remove('manager');
          break;   
          
        case "View All Roles":
          viewRoles();
          break;

        case "Add Role":
          addRole();
          break;

        case "End":
          connection.end();
          break;
      }
    });
}

function viewEmployee() {
  console.log("Viewing employees\n");

  const query = 
  `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
  FROM employee
  LEFT JOIN employee manager on manager.id = employee.manager_id
  INNER JOIN role ON (role.id = employee.role_id)
  INNER JOIN department ON (department.id = role.department_id)
  ORDER BY employee.id;`;

  connection.query(query, function (err, res) {
    if (err) throw err;

    console.table(res);
    console.log("Employees viewed!\n");

    firstPrompt();
  });

}


function viewEmployeeByDepartment() {
  console.log("Viewing employees by department\n");

  const query = 
   `SELECT department.name AS department, role.title, employee.id, employee.first_name, employee.last_name
    FROM employee
    LEFT JOIN role ON (role.id = employee.role_id)
    LEFT JOIN department ON (department.id = role.department_id)
    ORDER BY department.name;`;

  connection.query(query, function (err, res) {
    if (err) throw err;

    console.table(res);
    console.log("Department view succeed!\n");

    firstPrompt();
  });
}

function viewEmployeeByManager() {
    console.log("Viewing employees by Manager\n");
  
    const query = 
    `SELECT CONCAT(manager.first_name, ' ', manager.last_name) AS manager, department.name AS department, employee.id, employee.first_name, employee.last_name, role.title
    FROM employee
    LEFT JOIN employee manager on manager.id = employee.manager_id
    INNER JOIN role ON (role.id = employee.role_id && employee.manager_id != 'NULL')
    INNER JOIN department ON (department.id = role.department_id)
    ORDER BY manager;`;
  
    connection.query(query, function (err, res) {
      if (err) throw err;
  
      console.table(res);
      console.log("Department view succeed!\n");
  
      firstPrompt();
    });
  }



  async function addEmployee() {
    const addname = await inquirer.prompt(askName());
    connection.query('SELECT role.id, role.title FROM role ORDER BY role.id;', async (err, res) => {
        if (err) throw err;
        const { role } = await inquirer.prompt([
            {
                name: 'role',
                type: 'list',
                choices: () => res.map(res => res.title),
                message: 'What is the employee role?: '
            }
        ]);
        let roleId;
        for (const row of res) {
            if (row.title === role) {
                roleId = row.id;
                continue;
            }
        }
        connection.query('SELECT * FROM employee', async (err, res) => {
            if (err) throw err;
            let choices = res.map(res => `${res.first_name} ${res.last_name}`);
            choices.push('none');
            let { manager } = await inquirer.prompt([
                {
                    name: 'manager',
                    type: 'list',
                    choices: choices,
                    message: 'Choose the employee Manager: '
                }
            ]);
            let managerId;
            let managerName;
            if (manager === 'none') {
                managerId = null;
            } else {
                for (const data of res) {
                    data.fullName = `${data.first_name} ${data.last_name}`;
                    if (data.fullName === manager) {
                        managerId = data.id;
                        managerName = data.fullName;
                        console.log(managerId);
                        console.log(managerName);
                        continue;
                    }
                }
            }
            console.log('Employee has been added. Please view all employee to verify...');
            connection.query(
                'INSERT INTO employee SET ?',
                {
                    first_name: addname.first,
                    last_name: addname.last,
                    role_id: roleId,
                    manager_id: parseInt(managerId)
                },
                (err, res) => {
                    if (err) throw err;
                    firstPrompt();

                }
            );
        });
    });

}

function remove(input) {
  const promptQ = {
    yes: "yes",
    no: "no I don't (view all employees on the main option)"
};
inquirer.prompt([
    {
        name: "action",
        type: "list",
        message: "In order to proceed an employee, an ID must be entered. View all employees to get" +
            " the employee ID. Do you know the employee ID?",
        choices: [promptQ.yes, promptQ.no]
    }
]).then(answer => {
    if (input === 'manager' && answer.action === "yes") updateManager();
    else if (input === 'role' && answer.action === "yes") updateRole();
    else viewEmployees();

});
}


async function removeEmployee() {

    const answer = await inquirer.prompt([
        {
            name: "first",
            type: "input",
            message: "Enter the employee ID you want to remove:  "
        }
    ]);

    connection.query('DELETE FROM employee WHERE ?',
        {
            id: answer.first
        },
        function (err) {
            if (err) throw err;
        }
    )
    console.log('Employee has been removed on the system!');
    firstPrompt();

};

function askId() {
    return ([
        {
            name: "name",
            type: "input",
            message: "What is the employe ID?:  "
        }
    ]);
}


async function updateRole() {
    const employeeId = await inquirer.prompt(askId());

    connection.query('SELECT role.id, role.title FROM role ORDER BY role.id;', async (err, res) => {
        if (err) throw err;
        const { role } = await inquirer.prompt([
            {
                name: 'role',
                type: 'list',
                choices: () => res.map(res => res.title),
                message: 'What is the new employee role?: '
            }
        ]);
        let roleId;
        for (const row of res) {
            if (row.title === role) {
                roleId = row.id;
                continue;
            }
        }
        connection.query(`UPDATE employee 
        SET role_id = ${roleId}
        WHERE employee.id = ${employeeId.name}`, async (err, res) => {
            if (err) throw err;
            console.log('Role has been updated..')
            firstPrompt();
        });
    });
}

async function updateManager() {
  const employeeId = await inquirer.prompt(askId());

  connection.query(
  `SELECT DISTINCT e.manager_id, CONCAT(em.first_name,' ',em.last_name) AS Name
  FROM employee AS e
  INNER JOIN employee AS em
  ON e.manager_id = em.id
  ORDER BY e.manager_id;`, async (err, res) => {
      if (err) throw err;
      const { manager } = await inquirer.prompt([
          {
              name: 'manager',
              type: 'list',
              choices: () => res.map(res => res.Name),
              message: 'What is the new employee manager?: '
          }
      ]);
      let managerId;
      for (const row of res) {
          if (row.Name === manager) {
              managerId = row.manager_id;
              continue;
          }
      }
      connection.query(`UPDATE employee 
      SET manager_id = ${managerId}
      WHERE employee.id = ${employeeId.name}`, async (err, res) => {
          if (err) throw err;
          console.log('Manager has been updated..')
          firstPrompt();
      });
  });
}


function askName() {
    return ([
        {
            name: "first",
            type: "input",
            message: "Enter the first name: "
        },
        {
            name: "last",
            type: "input",
            message: "Enter the last name: "
        }
    ]);
}


function viewRoles() {
  console.log("Viewing All Roles\n");

  const query = 
  `SELECT Role.id, Role.title
  FROM Role; `;

  connection.query(query, function (err, res) {
    if (err) throw err;

    console.table(res);
    console.log("Roles viewed!\n");

    firstPrompt();
  });

}