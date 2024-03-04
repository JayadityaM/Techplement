import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const saltRounds=10;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "calculator",
  password: "30092004",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const createUserTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        ID SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
    );
`;

db.query(createUserTableQuery, (err, result) => {
    if (err) {
        console.error('Error creating user table:', err);
    } else {
        console.log('User table created successfully');
    }
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (checkResult.rows.length > 0) {
      res.send("User already exists. Try logging in.");
    } else {
      //pasword Hashing
      bcrypt.hash(password,saltRounds,async(err,hash)=>{
        if(err){
          console.log("Error hashing password:",err);
        }else{
          const result = await db.query(
          "INSERT INTO users (username, password) VALUES ($1, $2)",
          [username, hash]
          );
          res.render("calculator.ejs");
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const loginPassword = req.body.password;
  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;
      bcrypt.compare(loginPassword,storedHashedPassword,(err,result)=>{
        if(err){
          console.log("Error comparing passwords:",err);
        }else{
          if(result){
            res.render("calculator.ejs");
          }else{
            res.send("Incorrect Password");
          }
        }
      });
  }else{
    res.send("User not found");
  } 
}catch (err) {
    console.log(err);
  }
});

app.get("/logout",(req, res) => {
  res.render("home.ejs");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});