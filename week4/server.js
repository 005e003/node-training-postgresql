require("dotenv").config();
const http = require("http");
const AppDataSource = require("./db");
const errorHandle = require("./errorHandle");

//驗證格式
function isUndefined(value) {
  return value === undefined;
}

function isNotValidString(value) {
  return typeof value !== "string" || value.trim().length === 0 || value === "";
}

function isNotValidInteger(value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
}

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json",
  };
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try {
      const data = await AppDataSource.getRepository("CreditPackage").find({
        select: ["id", "name", "credit_amount", "price"],
      });

      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: data,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res);
    }
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const { name, credit_amount, price } = JSON.parse(body);
        if (
          isUndefined(name) ||
          isNotValidString(name) ||
          isUndefined(credit_amount) ||
          isNotValidInteger(credit_amount) ||
          isUndefined(price) ||
          isNotValidInteger(price)
        ) {
          //400
          res.writeHead(400, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "欄位未填寫正確",
            })
          );
          res.end();
          return;
        }

        const creditPackage = AppDataSource.getRepository("CreditPackage");
        const doubleCreditPackage = await creditPackage.find({
          where: {
            name: name,
          },
        });
        if (doubleCreditPackage.length > 0) {
          res.writeHead(409, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "資料重複",
            })
          );
          res.end();
          return;
        }

        const newCreditPackage = creditPackage.create({
          name,
          credit_amount,
          price,
        });
        const result = await creditPackage.save(newCreditPackage);
        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "sucess",
            data: result,
          })
        );
        res.end();
      } catch (error) {
        //500
        errorHandle(res);
      }
    });
  } else if (
    req.url.startsWith("/api/credit-package/") &&
    req.method === "DELETE"
  ) {
    try {
      const creditPackageId = req.url.split("/").pop();

      if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      const result = await AppDataSource.getRepository("CreditPackage").delete(
        creditPackageId
      );
      if (result.affected === 0) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
        })
      );
      res.end();
    } catch (error) {
      //500
      errorHandle(res);
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    try {
      const data = await AppDataSource.getRepository("Skill").find({
        select: ["id", "name"],
      });

      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: data,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res);
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const { name } = JSON.parse(body);
        if (isUndefined(name) || isNotValidString(name)) {
          res.writeHead(400, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "欄位未填寫正確",
            })
          );
          res.end();
          return;
        }
        const skillRepo = AppDataSource.getRepository("Skill");
        const doubleSkill = await skillRepo.find({
          where: {
            name,
          },
        });
        if (doubleSkill.length > 0) {
          res.writeHead(409, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "資料重複",
            })
          );
          res.end();
          return;
        }

        const newSkill = skillRepo.create({
          name,
        });
        const result = await skillRepo.save(newSkill);

        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            data: result,
          })
        );
        res.end();
      } catch (error) {
        errorHandle(res);
      }
    });
  } else if (
    req.url.startsWith("/api/coaches/skill/") &&
    req.method === "DELETE"
  ) {
    try {
      const skillId = req.url.split("/").pop();

      if (isUndefined(skillId) || isNotValidString(skillId)) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      const result = await AppDataSource.getRepository("Skill").delete(skillId);
      if (result.affected === 0) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "failed",
            message: "ID錯誤",
          })
        );
        res.end();
        return;
      }

      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: skillId,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res);
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(
      JSON.stringify({
        status: "failed",
        message: "無此網站路由",
      })
    );
    res.end();
  }
};

const server = http.createServer(requestListener);

async function startServer() {
  await AppDataSource.initialize();
  console.log("資料庫連接成功");
  server.listen(process.env.PORT);
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`);
  return server;
}

module.exports = startServer();
