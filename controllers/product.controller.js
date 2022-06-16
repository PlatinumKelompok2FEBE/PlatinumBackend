const { Product, Category, Picture } = require("../models");
const { validatePictures, uploadImages } = require("../utils/picture");
const { Op } = require("sequelize");

module.exports = {
  getProducts: (req, res) => {
    // Get products
    Product.findAll({
      include: [Category, Picture],
    })
      .then((products) => {
        // Get product category and pictures
        const productsData = products.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.Category.name,
          description: product.description,
          seller_id: product.seller_id,
          pictures: product.Pictures.map((picture) => picture.name),
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }));
        res.status(200).json({ products: productsData });
      })
      .catch((error) => {
        res.status(500).json({
          type: "SYSTEM_ERROR",
          message: "Something wrong with server",
        });
      });
  },

  getProduct: (req, res) => {
    // Validate product ID param
    if (!req.params || !req.params.id || !Number.isInteger(+req.params.id)) {
      return res.status(400).json({
        type: "VALIDATION_FAILED",
        message: "Valid Product ID is required",
      });
    }

    // Get product
    Product.findOne({
      where: {
        id: req.params.id,
      },
      include: [Category, Picture],
    })
      .then((product) => {
        // Check if product not found
        if (!product) {
          return res.status(404).json({
            type: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Get product pictures filename
        const productData = {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.Category.name,
          description: product.description,
          seller_id: product.seller_id,
          pictures: product.Pictures.map((picture) => picture.name),
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };

        res.status(200).json({
          product: productData,
        });
      })
      .catch((error) => {
        res.status(500).json({
          type: "SYSTEM_ERROR",
          message: "Something wrong with server",
        });
      });
  },

  createProduct: async (req, res) => {
    // Validate product required data
    if (
      !req.body ||
      !req.body.name ||
      !req.body.price ||
      !req.body.category ||
      !req.body.description ||
      !req.files
    ) {
      return res.status(400).json({
        type: "VALIDATION_FAILED",
        message:
          "Product name, price, category, description, and picture is required",
      });
    }

    // Validate product pictures
    try {
      validatePictures(req.files);
    } catch (error) {
      return res.status(400).json({
        type: "VALIDATION_FAILED",
        message: error.message,
      });
    }

    const { name, price, category, description } = req.body;

    try {
      // Get product category name
      const productCategory = await Category.findOne({
        where: {
          name: category,
        },
      });

      // Check if category exists
      if (!productCategory) {
        return res.status(400).json({
          type: "VALIDATION_FAILED",
          message: "Valid category name is required",
        });
      }

      // Create new product
      const newProduct = await Product.create({
        name,
        price,
        category_id: productCategory.id,
        description,
        seller_id: 1,
      });

      // Upload product pictures
      await uploadImages(req.files, newProduct.id);

      // Get new product data
      const product = await Product.findOne({
        where: {
          id: newProduct.id,
        },
        include: [Category, Picture],
      });

      const newProductData = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.Category.name,
        description: product.description,
        seller_id: product.seller_id,
        pictures: product.Pictures.map((picture) => picture.name),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };

      res.status(200).json({
        product: newProductData,
      });
    } catch (error) {
      return res.status(500).json({
        type: "SYSTEM_ERROR",
        message: "Something wrong with server",
      });
    }
  },

  updateProduct: (req, res) => {
    const { name, price, category, description } = req.body;
    console.log(req.body);
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "ID Must Be Integer" });
    }
    Category.findOne({
      where: {
        name: category,
      },
    }).then((result) => {
      if (!result) {
        return res.status(400).json({ message: "Category Not Found" });
      }
      Product.update(
        {
          name: name,
          price: price,
          category_id: result.id,
          description: description,
        },
        {
          where: {
            id: +req.params.id,
          },
          returning: true,
        }
      )
        .then((result) => {
          if (result[0] === 0) {
            res.status(400).json({ message: "Data Not Found!" });
          } else {
            res
              .status(200)
              .json({ message: "Product Updated", data: result[1] });
          }
        })
        .catch((err) => {
          res
            .status(400)
            .json({ message: "Error Updating User", err: err.message });
        });
    });
  },

  deleteProduct: (req, res) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "ID Must Be Integer" });
    }
    Product.destroy({ where: { id: req.params.id } })
      .then((result) => {
        console.log(result);
        if (result === 0) {
          res.status(400).json({ message: "Data Not Found!" });
        } else {
          res.status(200).json({ message: "Product Deleted" });
        }
      })
      .catch((err) => {
        res
          .status(500)
          .json({ message: "Error Deleting Product", err: err.message });
      });
  },
};
