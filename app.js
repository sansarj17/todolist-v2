const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
    "mongodb+srv://admin-sansarj17:testing17@cluster0.3lgl3.mongodb.net/todolistDB",
    {
        useNewUrlParser: true,
    }
);

const itemsSchema = new mongoose.Schema({
    name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!",
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
    items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Success Saved");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems,
            });
        }
    });
});

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
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    console.log("List Title : " + listName + " ID " + checkedItemId);

    if (listName === "Today") {
        console.log("In Today");
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Success Deletion");
                res.redirect("/");
            }
        });
    } else {
        console.log("Else");
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } },
            function (err, results) {
                if (!err) {
                    console.log("Success Deletion From : " + listName);
                    res.redirect("/" + listName);
                } else {
                    console.log(err);
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
                //console.log("Not found");
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
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

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started");
});
