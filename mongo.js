const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const port = 4055;

app.use(express.urlencoded({ extended: true }));

const mongoUrl = "mongodb://localhost:27017";
const dbName = "user";
let db;

MongoClient.connect(mongoUrl) 
    .then((client) => {
        db = client.db(dbName);
        console.log(`Connected to MongoDB: ${dbName}`);
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    });

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/insert", async (req, res) => {
    const { name, password } = req.body;
    try {
        await db.collection("profile").insertOne({ name, password });
        console.log("Document inserted: " + name);
        res.redirect("/");
    } catch (err) {
        console.error("Error inserting data:", err);
        res.status(500).send("Failed to insert data");
    }
});

app.get("/report", async (req, res) => {
    try {
        const items = await db.collection("profile").find().toArray();

        let tableContent = `
            <style>
                    body {
                        font-family: Arial, sans-serif;
                        
                    }
                    .container {
                        margin: 20px auto;
                        max-width: 800px;
                    }
                    h1 {
                        text-align: center;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    table, th, td {
                        border: 1px solid #ddd;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #fff;
                    }
                    a {
                        text-decoration: none; 
                        color: black;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
            </style>
            <div class='container'>
                <h1>Report</h1>
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Password</th>
                    </tr>
        `;
        tableContent += items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.password}</td>
                <td>
                    <a href="http://localhost:4055/edit/${item.name}" style="color: blue;">Update</a> | 
                    <a href="http://localhost:4055/delete/${item.name}" style="color: red;">Delete</a>
                </td>
            </tr>
        `).join("");

        
        
        tableContent += `
                </table>
                <a href='/'>Back to Form</a>
            </div>
        `;

        res.send(tableContent);
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).send("Failed to fetch data");
    }
});

app.get("/edit/:name", (req, res) => {
    res.sendFile(__dirname + "/update.html");
});

app.post("/update/:name", async (req, res) => {
    try {
        const uname = req.params.name;
        const { name, password } = req.body;

        
        if (!name || !password) {
            return res.status(400).send("Name and password are required");
        }
        if (password.length < 6) {
            return res.status(400).send("Password must be at least 6 characters long");
        }
        if (!isNaN(name)) {
            return res.status(400).send("Name cannot be a number");
        }
        
        const result = await db.collection("profile").updateOne(
            { name: uname },
            { $set: { name, password } }
        );


        if (result.matchedCount === 0) {
            return res.status(404).send("No document found with the given name");
        }

        res.redirect('/report');
    } catch (err) {
        console.error("Error updating data:", err);
        res.status(500).send("Failed to update data");
    }
});

app.get("/delete/:name", async (req, res) => {
    try {
        var name = req.params.name;
        await db.collection("profile").deleteOne({ name });
        res.redirect('/report');
    } catch (err) {
        console.error("Error deleting data:", err);
        res.status(500).send("Failed to delete data");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
