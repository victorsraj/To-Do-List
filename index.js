//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require('./config.json');
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const uri = `mongodb+srv://${config.username}:${config.password}@${config.cluster}?retryWrites=true&w=majority`;
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(uri);
};

// Create items schema
const itemsSchema = {
  name: String
};

// Create mongoose model
const Item = mongoose.model("Item", itemsSchema);

// *** DEFAULT ITEMS IN LIST ***
const item1 = new Item({
  name: "Welcome to your to-do list!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<--Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

// Create list schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Create mongoose model for listSchema
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find().then((foundItems) => {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
        .then(function() {
          console.log("Successfully saved!");
        })
        .catch(function(err){
          console.log(err);
      });
      res.redirect("/");
    } else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  }).catch(err => {
    console.log(err);
  });  
});


app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName})
    .then((foundList) => {
      if(!foundList){
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      } else{
        // show an existing List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }).catch((err) => {
      console.log(err);
    });
  

});


app.post("/", function(req, res){
  const itemName = req.body.newItem; // text that user entered into the textbox when clicked the + button
  const listName = req.body.list; // List that user is trying to add item to

  // create a new document to be stored in DB
  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();      // save the item into the DB
    res.redirect("/");  // redirect to the home route to show the item in the list

  } else {
    List.findOne({name: listName})
    .then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch((err) => {
      console.log(err);
    });
  }
});



app.post("/delete", (req, res) => {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
  } else {
    List.findOne({name: listName})
    .then((foundList) => {
      foundList.items.pull({_id: checkedItemId});
      foundList.save();
      res.redirect("/" + listName);
    }).catch((err) => {
      console.log(err);
    });
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
