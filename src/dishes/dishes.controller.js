const target = { id: "hello", a: 1, b: 2 };
const updater = { b: 4, a: 5 };

const path = require("path");
const { forEach } = require("../data/dishes-data");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (!foundDish) {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }
  res.locals.dish = foundDish;
  next();
};

const requiredFieldsCheck = (req, res, next) => {
  const requiredFields = ["name", "description", "price", "image_url"];
  const data = req.body.data || {};
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  }
  res.locals.data = data;
  next();
};

const priceValidator = (req, res, next) => {
  const priceCheck = res.locals.data.price;
  if (typeof priceCheck !== "number" || priceCheck <= 0) {
    return next({
      status: 400,
      message: "Dish must hav a price that is an integer greater than 0",
    });
  }
  next();
};

const idValidator = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
};

const list = (req, res, next) => {
  res.json({ data: dishes });
};

const read = (req, res, next) => {
  res.json({ data: res.locals.dish });
};

const update = (req, res, next) => {
  if (res.locals.data.hasOwnProperty("id")) {
    delete res.locals.data.id;
  }
  const response = Object.assign(res.locals.dish, res.locals.data);
  res.json({ data: response });
};

const create = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    name,
    description,
    price,
    image_url,
    id: nextId(),
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
  next();
};

module.exports = {
  list,
  create: [requiredFieldsCheck, priceValidator, create],
  read: [dishExists, read],
  update: [
    dishExists,
    requiredFieldsCheck,
    priceValidator,
    idValidator,
    update,
  ],
};
