let express = require('express')
let app = express()
app.use(express.json())
let bcrypt = require('bcrypt')
let {open} = require('sqlite')
let sqlite3 = require('sqlite3')
let path = require('path')

let db_path = path.join(__dirname, 'userData.db')
let dataBase = null

let initialize_db_server = async () => {
  try {
    dataBase = await open({
      filename: db_path,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running on Port 3000')
    })
  } catch (error) {
    console.log(error.message)
  }
}

initialize_db_server()

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body
  let hashed_passwd = await bcrypt.hash(password, 10)
  //console.log(hashed_passwd)
  let query = `
  select 
  *
  from 
  user
  where 
  username="${username}";

  `
  let db_response = await dataBase.get(query)
  //console.log(db_response)

  let create_user = null

  if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    if (db_response === undefined) {
      create_user = `
  insert into user (username,name,password,gender,location)
  values("${username}","${name}","${hashed_passwd}","${gender}","${location}" )
  `
      let db_user_create = await dataBase.run(create_user)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('User already exists')
    }
  }
})

app.post('/login', async (request, response) => {
  let {username, password} = request.body
  let query = `
select 
*
from 
user 
where 
username="${username}";

`
  let db_user = await dataBase.get(query)

  if (db_user === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    let dcrypt = await bcrypt.compare(password, db_user.password)
    console.log(dcrypt)
    if (dcrypt) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  let {username, oldPassword, newPassword} = request.body
  // console.log(username)
  let query = `
 select 
 *
 from 
 user
 where 
 username="${username}" ;

 `
  let db_response = await dataBase.get(query)
  let data_old_password = db_response.password
  //console.log(data_old_password)
  let compare_old_new_password = await bcrypt.compare(
    oldPassword,
    data_old_password,
  )

  if (compare_old_new_password) {
    // console.log('hii')
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let new_password = await bcrypt.hash(newPassword, 10)
      let new_query = `
      UPDATE 
      user 
      set 
      password='${new_password}'
      where
      username='${username}'
      `
      await dataBase.run(new_query)
      response.status(200)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
