//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const _ = require("lodash");

const port = process.env.PORT;

const { Schema } = mongoose;
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {
  useNewUrlParser: true,
});

//schema
const itemSchema = new Schema({
  name: String,
});

// model
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({ name: "Welcome to your todolist!" });

const item2 = new Item({
  name: "Hit the + button to add new item.",
});

const item3 = new Item({
  name: "<-- Hit this button to delete an item.",
});
const defaultItems = [item1, item2, item3];

// new schema
const listSchema = new Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      //saving item
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

//

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const itemIdToDelete = req.body.idToRemove;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemIdToDelete, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });

    // Item.findByIdAndRemove(itemIdToDelete).exec();
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: itemIdToDelete } } },
      function (err, foundList) {
        if (!err) {
          console.log("Successfully deleted checked item.");
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list if not exist
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show `existing list

        // if (foundList.items.length === 0) {
        //   foundList.items = defaultItems;
        // }

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
