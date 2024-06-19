const format = require('date-fns/format')
var isValid = require('date-fns/isValid')
var isMatch = require('date-fns/isMatch')
const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error: ${e.message}')
    process.exit(1)
  }
}
initializeDBAndServer()

const hasPriorityAndStatus = reqQuery => {
  return reqQuery.priority !== undefined && reqQuery.status !== undefined
}
const hasPriorityAndCategory = reqQuery => {
  return reqQuery.priority !== undefined && reqQuery.category !== undefined
}
const hasCategoryAndStatus = reqQuery => {
  return reqQuery.category !== undefined && reqQuery.status !== undefined
}
const hasPriority = reqQuery => {
  return reqQuery.priority !== undefined
}
const hasSearch = reqQuery => {
  return reqQuery.search_q !== undefined
}
const hasStatus = reqQuery => {
  return reqQuery.status !== undefined
}
const hasCategory = reqQuery => {
  return reqQuery.category !== undefined
}

const converDbObject = a => {
  return {
    id: a.id,
    todo: a.todo,
    priority: a.priority,
    category: a.category,
    status: a.status,
    dueDate: a.due_date,
  }
}

//API 1
app.get('/todos/', async (req, res) => {
  let getquery = ''
  let data = ''
  let {search_q = '', status, priority, category} = req.query
  switch (true) {
    case hasPriorityAndStatus(req.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getquery = `SELECT * FROM  todo WHERE  status = '${status}' AND priority = '${priority}';`
          data = await db.all(getquery)
          res.send(data.map(a => converDbObject(a)))
        } else {
          res.status(400)
          res.send('Invalid Todo Status')
        }
      } else {
        res.status(400)
        res.status('Invalid Todo Priority')
      }

      break

    case hasCategoryAndStatus(req.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getquery = `SELECT * FROM  todo WHERE  category = '${category}' AND status = '${status}';`
          data = await db.all(getquery)
          res.send(data.map(a => converDbObject(a)))
        } else {
          res.status(400)
          res.send('Invalid Todo Status')
        }
      } else {
        res.status(400)
        res.status('Invalid Todo Category')
      }

      break
    case hasPriorityAndCategory(req.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getquery = `SELECT * FROM  todo WHERE  category = '${category}' AND priority = '${priority}';`
          data = await db.all(getquery)
          res.send(data.map(a => converDbObject(a)))
        } else {
          res.status(400)
          res.send('Invalid Todo Priority')
        }
      } else {
        res.status(400)
        res.status('Invalid Todo Category')
      }

      break
    case hasPriority(req.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getquery = `SELECT * FROM todo WHERE  priority = '${priority}';`
        data = await db.all(getquery)
        res.send(data.map(a => converDbObject(a)))
      } else {
        res.status(400)
        res.send('Invalid Todo Priority')
      }

      break
    case hasStatus(req.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getquery = `SELECT * FROM todo WHERE  status = '${status}';`
        data = await db.all(getquery)
        res.send(data.map(a => converDbObject(a)))
      } else {
        res.status(400)
        res.send('Invalid Todo Status')
      }

      break
    case hasSearch(req.query):
      getquery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getquery)
      res.send(data.map(a => converDbObject(a)))
      break

    case hasCategory(req.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getquery = `SELECT * FROM    todo WHERE  category = '${category}';`
        data = await db.all(getquery)
        res.send(data.map(a => converDbObject(a)))
      } else {
        res.status(400)
        res.send('Invalid Todo Category')
      }

      break
    default:
      getquery = `SELECT * FROM todo ;`
      data = await db.all(getquery)
      res.send(data.map(a => converDbObject(a)))
  }
})
// API 2
app.get('/todos/:todoId', async (req, res) => {
  let {todoId} = req.params
  let getquery = `SELECT * FROM todo WHERE id = ${todoId};`
  let data = await db.get(getquery)
  res.send(converDbObject(data))
})
app.get('/agenda/', async (req, res) => {
  let {date} = req.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    let query = `SELECT * FROM todo WHERE due_date = '${newDate}';`
    let result = await db.all(query)
    res.send(result.map(a => converDbObject(a)))
  } else {
    res.status(400)
    res.send('Invalid Due Date')
  }
})

// API 4
app.post('/todos/', async (req, res) => {
  let {id, todo, priority, status, category, dueDate} = req.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDate = format(new Date(dueDate), 'yyyy-MM-dd')
          let getquery = `INSERT INTO todo (id,todo,priority,status,category,due_date) VALUES (${id},'${todo}','${priority}', '${status}','${category}','${newDate}');  `
          await db.run(getquery)
          res.send('Todo Successfully Added')
        } else {
          res.status(400)
          res.send('Invalid Due Date')
        }
      } else {
        res.status(400)
        res.send('Invalid Todo Category')
      }
    } else {
      res.status(400)
      res.send('Invalid Todo Status')
    }
  } else {
    res.status(400)
    res.send('Invalid Todo Priority')
  }
})
// API 5
app.put('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params
  let update = ''
  let reqbody = req.body

  let previousquery = `SELECT * FROM todo WHERE id = ${todoId};`
  let result = await db.get(previousquery)
  const {
    todo = result.todo,
    status = result.status,
    priority = result.priority,
    category = result.category,
    dueDate = result.dueDate,
  } = req.body
  switch (true) {
    case reqbody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        update = `UPDATE todo SET todo= '${todo}' , status = '${status}' , priority = '${priority}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};  `
        await db.run(update)
        res.send('Status Updated')
      } else {
        res.status(400)
        res.send('Invalid Todo Status')
      }

      break
    case reqbody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        update = `UPDATE todo SET todo= '${todo}' , status = '${status}' , priority = '${priority}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};  `
        await db.run(update)
        res.send('Priority Updated')
      } else {
        res.status(400)
        res.send('Invalid Todo Priority')
      }

      break
    case reqbody.todo !== undefined:
      update = `UPDATE todo SET todo= '${todo}' , status = '${status}' , priority = '${priority}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};  `
      await db.run(update)
      res.send('Todo Updated')

      break
    case reqbody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        update = `UPDATE todo SET todo= '${todo}' , status = '${status}' , priority = '${priority}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};  `
        await db.run(update)
        res.send('Category Updated')
      } else {
        res.status(400)
        res.send('Invalid Todo Category')
      }
      break
    case reqbody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDate = format(new Date(dueDate), 'yyyy-MM-dd')
        let getquery = `UPDATE todo SET todo= '${todo}' , status = '${status}' , priority = '${priority}', category = '${category}', due_date = '${newDate}' WHERE id = ${todoId};  `
        await db.run(getquery)
        res.send('Due Date Updated')
      } else {
        res.status(400)
        res.send('Invalid Due Date')
      }
      break
  }
})

// API 6
app.delete('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params
  let getquery = `DELETE FROM todo WHERE id = ${todoId};`
  await db.run(getquery)

  res.send('Todo Deleted')
})
module.exports = app
