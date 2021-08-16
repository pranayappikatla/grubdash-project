const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  }
  res.locals.order = foundOrder;
  next();
};

const requiredFieldsCheck = (req, res, next) => {
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  const data = req.body.data || {};
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  }

  if (!Array.isArray(data.dishes) || data.dishes.length === 0) {
    return next({
      status: 400,
      message: `Dish must include at least one dish`,
    });
  }
  for (const index in data.dishes) {
    console.log(index);
    if (
      !data.dishes[index].quantity ||
      data.dishes[index].quantity === 0 ||
      !Number.isInteger(data.dishes[index].quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  res.locals.data = data;
  next();
};

const idValidator = (req, res, next) => {
  const { data: { id, status } = {} } = req.body;
  const { orderId } = req.params;

  if (res.locals.order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }

  if (
    !status ||
    !["pending", "preparing", "out-for-delivery", "delivered"].includes(status)
  ) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
};

const validateStatus = (req, res, next) => {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
};

const list = (req, res) => {
  res.json({ data: orders });
};

const read = (req, res) => {
  res.json({ data: res.locals.order });
};

const update = (req, res) => {
  if (res.locals.data.hasOwnProperty("id")) {
    delete res.locals.data.id;
  }
  const response = Object.assign(res.locals.order, res.locals.data);
  res.json({ data: response });
};

const create = (req, res) => {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    deliverTo,
    mobileNumber,
    dishes,
    id: nextId(),
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

const deleter = (req, res) => {
  orders.splice(orders.indexOf(res.locals.order), 1);
  res.sendStatus(204);
};

// TODO: Implement the /orders handlers needed to make the tests pass
module.exports = {
  list,
  create: [requiredFieldsCheck, create],
  read: [orderExists, read],
  update: [orderExists, requiredFieldsCheck, idValidator, update],
  delete: [orderExists, validateStatus, deleter],
};
