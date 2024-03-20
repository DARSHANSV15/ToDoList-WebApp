//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { name } = require("ejs");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-ds15:test123@cluster0.if6fcjb.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving items");
  }
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
  .then(foundList => {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  })
  .catch(err => {
    // Handle error
    console.error(err);
  });

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    async function handleListUpdate() {
      try {
        const foundList = await List.findOne({ name: listName });
        
        if (foundList) {
          foundList.items.push(item);
          await foundList.save();
          res.redirect("/" + listName);
        } else {
          // Handle the case where the list with the given name is not found
          throw new Error('List not found');
        }
      } catch (err) {
        // Handle errors appropriately
        console.error(err);
      }
    }
    
    // Call the async function
    handleListUpdate();
    
  }
});

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName; // Use req.body.listName for listName

  if (listName === "Today") {
    try {
      await Item.findByIdAndDelete(checkedItemId);
      res.redirect("/"); // Redirect to the home route after deleting an item
    } catch (err) {
      console.log(err);
      res.status(500).send("Error deleting item");
    }
  } else {
    try {
      const updatedList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
  
      if (updatedList) {
        res.redirect("/" + listName);
      }
    } catch (err) {
      // Handle errors appropriately
      console.error(err);
      res.status(500).send("Error deleting item from list");
    }
  }
});



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
