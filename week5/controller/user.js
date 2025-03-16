const bcrypt = require("bcrypt");
const { IsNull, In } = require("typeorm");

const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("UserController");
const generateJWT = require("../utils/generateJWT");

const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;

const { isUndefined, isNotValidString } = require("../utils/verification");

const userController = {
  async postSignup(req, res, next) {
    try {
      const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
      const { name, email, password } = req.body;
      if (
        isUndefined(name) ||
        isNotValidString(name) ||
        isUndefined(email) ||
        isNotValidString(email) ||
        isUndefined(password) ||
        isNotValidString(password)
      ) {
        logger.warn("欄位未填寫正確");
        res.status(400).json({
          status: "failed",
          message: "欄位未填寫正確",
        });
        return;
      }
      if (!passwordPattern.test(password)) {
        logger.warn(
          "建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
        );
        res.status(400).json({
          status: "failed",
          message:
            "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字",
        });
        return;
      }
      const userRepository = dataSource.getRepository("User");
      const existingUser = await userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        logger.warn("建立使用者錯誤: Email 已被使用");
        res.status(409).json({
          status: "failed",
          message: "Email 已被使用",
        });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const newUser = userRepository.create({
        name,
        email,
        role: "USER",
        password: hashPassword,
      });

      const savedUser = await userRepository.save(newUser);
      logger.info("新建立的使用者ID:", savedUser.id);

      res.status(201).json({
        status: "success",
        data: {
          user: {
            id: savedUser.id,
            name: savedUser.name,
          },
        },
      });
    } catch (error) {
      logger.error("建立使用者錯誤:", error);
      next(error);
    }
  },

  async postLogin(req, res, next) {
    try {
      const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
      const { email, password } = req.body;
      if (
        isUndefined(email) ||
        isNotValidString(email) ||
        isUndefined(password) ||
        isNotValidString(password)
      ) {
        logger.warn("欄位未填寫正確");
        res.status(400).json({
          status: "failed",
          message: "欄位未填寫正確",
        });
        return;
      }
      if (!passwordPattern.test(password)) {
        logger.warn(
          "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
        );
        res.status(400).json({
          status: "failed",
          message:
            "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字",
        });
        return;
      }
      const userRepository = dataSource.getRepository("User");
      const existingUser = await userRepository.findOne({
        select: ["id", "name", "password"],
        where: { email },
      });

      if (!existingUser) {
        res.status(400).json({
          status: "failed",
          message: "使用者不存在或密碼輸入錯誤",
        });
        return;
      }
      logger.info(`使用者資料: ${JSON.stringify(existingUser)}`);
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        res.status(400).json({
          status: "failed",
          message: "使用者不存在或密碼輸入錯誤",
        });
        return;
      }
      const token = await generateJWT(
        {
          id: existingUser.id,
        },
        config.get("secret.jwtSecret"),
        {
          expiresIn: `${config.get("secret.jwtExpiresDay")}`,
        }
      );

      res.status(201).json({
        status: "success",
        data: {
          token,
          user: {
            name: existingUser.name,
          },
        },
      });
    } catch (error) {
      logger.error("登入錯誤:", error);
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const { id } = req.user;
      const userRepository = dataSource.getRepository("User");
      const user = await userRepository.findOne({
        select: ["name", "email"],
        where: { id },
      });
      res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error("取得使用者資料錯誤:", error);
      next(error);
    }
  },

  async putProfile(req, res, next) {
    try {
      const { id } = req.user;
      const { name } = req.body;
      if (isUndefined(name) || isNotValidString(name)) {
        logger.warn("欄位未填寫正確");
        res.status(400).json({
          status: "failed",
          message: "欄位未填寫正確",
        });
        return;
      }
      const userRepository = dataSource.getRepository("User");
      const user = await userRepository.findOne({
        select: ["name"],
        where: {
          id,
        },
      });
      if (user.name === name) {
        res.status(400).json({
          status: "failed",
          message: "使用者名稱未變更",
        });
        return;
      }
      const updatedResult = await userRepository.update(
        {
          id,
          name: user.name,
        },
        {
          name,
        }
      );
      if (updatedResult.affected === 0) {
        res.status(400).json({
          status: "failed",
          message: "更新使用者資料失敗",
        });
        return;
      }
      const result = await userRepository.findOne({
        select: ["name"],
        where: {
          id,
        },
      });
      res.status(200).json({
        status: "success",
        data: {
          user: result,
        },
      });
    } catch (error) {
      logger.error("取得使用者資料錯誤:", error);
      next(error);
    }
  },
};

module.exports = userController;
