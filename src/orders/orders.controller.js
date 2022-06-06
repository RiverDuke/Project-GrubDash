const { type } = require("express/lib/response");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
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

const dishCheck = (req, res, next) => {
  const dishes = req.body.data.dishes;

  if (!dishes) {
    next({
      status: 400,
      message: "Order must include a dish",
    });
  }

  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: "Order must include a dish",
    });
  }

  for (let dish in dishes) {
    const current = dishes[dish].quantity;
    if (!current || current <= 0 || typeof current !== "number") {
      message = `Dish ${dish} must have a quantity that is an integer greater than 0`;
      next({
        status: 400,
        message,
      });
    }
  }

  next();
};

const routeBodyMatch = (req, res, next) => {
  if (req.params.orderId === req.body.data.id) {
    next();
  } else if (!req.body.data.id) {
    next();
  } else {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${req.params.orderId}`,
    });
  }
};

const statusCheck = (req, res, next) => {
  const status = req.body.data.status;
  const err = {
    status: 400,
    message:
      "Order must have a status of pending,preparing, out-for-delivery,delivered",
  };

  if (!status || status.length < 1) {
    next(err);
  }
  if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  if (status === "pending") {
    next();
  }
  if (status === "preparing") {
    next();
  }
  if (status === "out-for-delivery") {
    next();
  }
  next(err);
};

const statusPendingCheck = (req, res, next) => {
  const ID = req.params.orderId;
  const index = orders.findIndex((order) => order.id === ID);
  if (orders[index].status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
};

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const ID = req.params.orderId;
  const {
    data: { id, deliverTo, mobileNumber, status, dishes, quantity } = {},
  } = req.body;
  const index = orders.findIndex((order) => order.id === ID);

  // update the paste
  orders[index].id = ID;
  orders[index].deliverTo = deliverTo;
  orders[index].mobileNumber = mobileNumber;
  orders[index].status = status;
  orders[index].dishes = dishes;

  res.json({ data: orders[index] });
}

const read = (req, res) => {
  const ID = req.params.orderId;
  const order = orders.find((itr) => itr.id === ID);
  res.json({ data: order });
};

const list = (req, res, next) => {
  res.json({ data: orders });
};

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // `splice()` returns an array of the deleted elements, even if it is one element
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    stringCheck("deliverTo"),
    stringCheck("mobileNumber"),
    dishCheck,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    routeBodyMatch,
    statusCheck,
    stringCheck("deliverTo"),
    stringCheck("mobileNumber"),
    dishCheck,
    update,
  ],
  destroy: [orderExists, statusPendingCheck, destroy],
};
