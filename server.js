const express = require('express');
const app  = express();
const { pool } = require('./db_config')
const bcrypt = require('bcrypt')
const session = require('express-session');
const flash = require('express-flash');


const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}))

app.use(flash());

app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/users/register', (req, res)=>{
    res.render("register");
});

app.get('/users/login', (req, res)=>{
    res.render("login");
});

app.get('/users/dashboard', (req, res)=>{
    res.render("dashboard", {user: "sai"});
});

app.post("/users/register", async(req, res)=>{
    let {name, email, password, password2} = req.body;
    console.log({name, email, password, password2});

    let errors =[];
    if (!name || !email || !password || !password2){
        errors.push({message: "Please enter all feilds"});
    }

    if (password.length <6){
        errors.push({message: "Password must contain 6 characers"});
    }

    if (password != password2){
        errors.push({message: "Password do not match..!"});
    }

    if (errors.length > 0){
        res.render("register", {errors});
    } else{
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(`SELECT * FROM users WHERE EMAIL = $1`,[email], (err, results)=>{
            if(err){
                throw err;
            }
            console.log(results.rows);

            if (results.rows.length > 0){
                errors.push({message: "Email already registered"});
                res.render('register', {errors});
            }else{
                pool.query(
                    `INSERT INTO users (name, email, password)
                    VALUES($1, $2, $3) RETURNING id , password`, 
                    [name, email, hashedPassword], (err, results)=>{
                        if (err){
                            throw err
                        }
                        console.log(results.row);
                        req.flash("success_msg", 'Registered successfully, Please login ');
                        res.redirect('/users/login');
                    }
                )
            }
        } )
    }
})


app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});
