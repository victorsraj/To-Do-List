//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const config = require('./config.json');
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;

// mongodb+srv://dbAdmin:<password>@cluster0.b6xqq.mongodb.net/?retryWrites=true&w=majority
const url = `mongodb+srv://${config.username}:${config.password}@${config.cluster}/?retryWrites=true&w=majority`;
// create a new mongo client instance
const client = new MongoClient(url);

// connect ot the url provided
client.connect((err) => {
    // if there is an error then throw because our server depends on our database
    if (err) {
        throw new Error('Failed to connect to MongoDB');
    }

    console.log('Connected to MongoDB');
});
const db = client.db();
const app = express();
const item1 = "Welcome to your to do list!";
const item2 = "Click the + button to add a new item.";
const item3 = "<-- Hit this button to delete an item.";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", async (req, res) => {

    const day = date.getDate();
    // db and collection to search from
    const collection = client.db("To-Do-Items").collection("Items");
    
    // get all snippets by passing in an empty object for finding everything
    let allToDoListTasks = await collection.find({}).toArray();

    // if there are no items in the list, populate with default list
    if(allToDoListTasks.length<1){
        try {
            const collection = client.db("To-Do-Items").collection("Items");
            // Post to MongoDB
            const timestamp = Date().toString();
            let item = item1;
            await collection.insertOne({ item, timestamp });
            item = item2;
            await collection.insertOne({ item, timestamp });
            item = item3;
            await collection.insertOne({ item, timestamp });
        } catch (error) {
            res.status(500).json(error);
        }
    }
    allToDoListTasks = await collection.find({}).toArray();
    res.render("list", {
        listTitle: day,
        newListItem: allToDoListTasks
    });
});

app.post("/", async (req, res) => {
    // get the new task name
    const item = req.body.newItem;

    // if the task is for the work list
    if(req.body.list === "Work"){
        try {
            const collection = client.db("To-Do-Items").collection("Work-Items");
            // Post to MongoDB
            const timestamp = Date().toString();
            await collection.insertOne({ item, timestamp });
        } catch (error) {
            res.status(500).json(error);
        }
        res.redirect("/work");
    } else { // else the task is for to do list 
        try {
            const collection = client.db("To-Do-Items").collection("Items");
            // Post to MongoDB
            const timestamp = Date().toString();
            await collection.insertOne({ item, timestamp });
        } catch (error) {
            res.status(500).json(error);
        }
        res.redirect("/");
    }
    
});

app.get("/:customListName", async (req, res) => {
    const list = req.params.customListName;
    console.log(list);

    // db and collection to search from
    const collection = client.db("To-Do-Items").collection("Work-Items");
    
    // get all snippets by passing in an empty object for finding everything
    const allWorkListTasks = await collection.find({}).toArray();

    //if there are no items in the list, populate with default list
    if(allWorkListTasks.length < 1 ){
        try {
            const collection = client.db("To-Do-Items").collection("Work-Items");
            // Post to MongoDB
            const timestamp = Date().toString();
            let item = item1;
            await collection.insertOne({ item, timestamp });
            item = item2;
            await collection.insertOne({ item, timestamp });
            item = item3;
            await collection.insertOne({ item, timestamp });
        } catch (error) {
            res.status(500).json(error);
        }
    }
    
    res.render("list", {
        listTitle: "Work List",
        newListItem: allWorkListTasks
    });
    
});

app.post("/delete", async (req, res) => {
    // get the ID for the item to delete
    const checkedItemId = req.body.checkbox; 
    try {
        // set collection to delete from
        const collection = client.db("To-Do-Items").collection("Items");
        // Delete from MongoDB
        await collection.deleteOne({_id: new mongodb.ObjectId(checkedItemId) });
        res.redirect("/");
    } catch (error) {
        res.status(500).json(error);
    }
});

app.post("/work", async (req,res) => {
    // console.log('Connected');
    // try {
    //     const collection = client.db("To-Do-Items").collection("Items");
  
    //     const item = req.body.newItem;
    //     console.log('done.09');
    //     workItems.push(item);
    //     console.log("done1");
    //     // Post to MongoDB
    //     const timestamp = Date().toString();
    //     console.log("done2");
    //     await collection.insertOne({ item, timestamp });
    //     console.log("done3");
    // } catch (error) {
    //     res.status(500).json(error);
    // }
    // console.log("done");
    // res.redirect("/work");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});