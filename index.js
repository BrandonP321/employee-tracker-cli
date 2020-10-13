const { prompt } = require('inquirer');
const inquirer = require('inquirer');
const mysql = require('mysql');

let rolesArr;
let departmentsArr;
let employeesArr;

const userChoices = [
    'Add a department',
    'Add a role',
    'Add an employee',
    'View a department',
    'View a role',
    'View an employee',
    "Update an employee's role",
    "View employees by manager",
    "Delete a department",
    "Delete a role",
    "Delete an employee",
    "View the total utilized budget of a department"
]

const connection = mysql.createConnection({
host: "localhost",

port: 3306,

user: "root",

password: "scooby321",
database: "employees_db"
});

connection.connect(function(err) {
    if (err) throw err;

    updateRolesList();
});

function promptUser() {
    inquirer.prompt(
        {
            type: 'list',
            message: "What would you like to do?",
            choices: userChoices,
            name: "userChoice"
        }
    ).then(function(answer) {
        switch (answer.userChoice) {
            case 'Add a department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
        }
    })
}

function addDepartment() {
    inquirer.prompt([
        {
            type: 'input',
            message: "What department would you like to add?",
            name: "departmentToAdd"
        },
        {
            type: 'confirm',
            message: "Would you like to add a role to this department right now?",
            name: "addRole"
        }
    ]).then(function(answer) {
        connection.query("INSERT INTO department(name) VALUES(?);", answer.departmentToAdd, function(err, data) {
            if(err) throw err;
        });
        console.log("\n***DEPARTMENT HAS BEEN ADDED***\n")
        if (answer.addRole) {
            departmentsArr.push(answer.departmentToAdd)
            addRole(answer.departmentToAdd)
        } else {
            promptUser();
        }
        
    })
}

function addRole(department=null) {
    // first make sure that arrays of roles and departments is up to date

    inquirer.prompt([
        {
            type: 'input',
            message: 'What role would you like to add?',
            name: 'role'
        },
        {
            when: function() {return !department},
            type: 'list',
            message: 'What department is this role a part of?',
            choices: departmentsArr,
            name: 'department'
        },
        {
            type: 'number',
            message: "What is the salary of this role?",
            name: "salary"
        },
        {
            type: 'confirm',
            message: "Would you like to add an employee to this role right now?",
            name: 'addEmployeeToRole'
        }
    ]).then(function(answer) {
        let departmentToAdd = '';
        if (answer.hasOwnProperty('department')) departmentToAdd = answer.department;
        else departmentToAdd = department;

        // get id of department to add it to the role
        connection.query("SELECT id FROM department WHERE name=?", departmentToAdd, function(err, data) {
            if(err) throw err;

            // insert the new row into the role table
            connection.query("INSERT INTO role(title, salary, department_id) VALUES(?, ?, ?)", [answer.role, answer.salary, data[0].id], function(err, data) {
                if(err) throw err;
                console.log('\n***NEW ROLE SUCCESSFULLY ADDED***\n')
                // push the new role to the roles array for user in user prompts
                rolesArr.push(answer.role)
                if (answer.addEmployeeToRole) {
                    // if chosen by the user, add an employee to the new role
                    addEmployee(answer.role)
                } else {
                    // else, prompt the user for further action
                    promptUser();
                }
            });
        });

    })
}

function addEmployee(role=null) {
    inquirer.prompt([
        {
            type: 'input',
            message: "What is the employees first name?",
            name: "firstName"
        },
        {
            type: 'input',
            message: "What is the employees last name?",
            name: "lastName"
        },
        {
            when: function(){return !role},
            type: 'list',
            choices: rolesArr,
            message: "What is the role of the employee?",
            name: role
        }
    ])
}

function updateRolesList() {
    connection.query("SELECT title FROM role", function(err, data) {
        if(err) throw err;
        rolesArr = [];
        data.forEach(role => rolesArr.push(role.title))
        updateDepartmentsList();
    });
}

function updateDepartmentsList() {
    connection.query("SELECT name FROM department", function(err, data) {
        if(err) throw err;
        departmentsArr = [];
        data.forEach(department => departmentsArr.push(department.name))
        updateEmployeeList()
    });
}

function updateEmployeeList() {
    connection.query("SELECT first_name, last_name FROM employee", function(err, data) {
        if(err) throw err;
        employeesArr = [];
        data.forEach(employee => employeesArr.push(employee.first_name, employee.last_name))
        promptUser();
    });
}
