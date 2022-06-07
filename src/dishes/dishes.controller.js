const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const index = dishes.findIndex((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    res.locals.index = index;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function stringCheck(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      if (data[propertyName].length > 0) {
        return next();
      }
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

function priceCheck(req, res, next) {
  const { data: { price } = {} } = req.body;
  let message = "Dish must have a price that is an integer greater than 0";

  if (!price) {
    message = "Dish must include a price";
  }
  if (price && typeof price === "number" && price > 0) {
    next();
  }
  next({
    status: 400,
    message,
  });
}

function routeBodyMatch(req, res, next) {
  if (req.params.dishId === req.body.data.id) {
    next();
  } else if (!req.body.data.id) {
    next();
  } else {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`,
    });
  }
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res, next) {
  res.json({ data: dishes });
}

function read(req, res) {
  const Dish = res.locals.dish;
  res.json({ data: Dish });
}

function update(req, res) {
  const ID = req.params.dishId;
  const { data: { id, name, description, image_url, price } = {} } = req.body;
  const index = res.locals.index;

  dishes[index].id = ID;
  dishes[index].name = name;
  dishes[index].description = description;
  dishes[index].image_url = image_url;
  dishes[index].price = price;

  res.json({ data: dishes[index] });
}

module.exports = {
  list,
  create: [
    stringCheck("name"),
    stringCheck("description"),
    stringCheck("image_url"),
    priceCheck,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    routeBodyMatch,
    stringCheck("name"),
    stringCheck("description"),
    stringCheck("image_url"),
    priceCheck,
    update,
  ],
};
